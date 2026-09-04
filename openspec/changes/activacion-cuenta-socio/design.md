## Context

Ver `proposal.md — Why` para la motivación y los números de producción. Lo que importa acá son las restricciones que condicionan la solución:

1. **El estado que falta no tiene dónde vivir hoy.** `Profesional.status` es padrón. `auth.users.last_sign_in_at` dice "entró", no "activó". No existe ningún campo que signifique "esta persona tiene su contraseña".
2. **`updatePassword` es una única llamada a `supabase.auth.updateUser`.** Todo lo que se agregue fuera de esa llamada reintroduce el mismo estado parcial que este change viene a eliminar.
3. **`InvitacionRepository` ya tiene la confusión horneada.** Calcula `ACTIVADO = email_confirmed_at || last_sign_in_at`. El panel `/admin/invitaciones` cuenta como "activado" a cualquiera que haya abierto el link, tenga contraseña o no. Hoy los dos números coinciden por casualidad (49 y 49); en cuanto alguien abra su link sin terminar de activar, el panel va a mentir sin que nadie lo note. Corregir el flujo sin corregir esto deja al Círculo mirando el mismo número falso.
4. **El middleware ya resuelve `/mi-panel` sin sesión → `/login` y `/admin` sin rol → `/mi-panel`.** El guard nuevo tiene que convivir con esas dos reglas sin armar ciclos.
5. **Ya existe infraestructura de rescate.** `reenviarInvitacion` (`src/app/admin/profesionales/actions.ts`) usa `generateLink` + Resend y funciona; `/admin/invitaciones` ya tiene su `BotonReenviar`. No hay que construir nada de eso.
6. **244 personas reales.** Cualquier regla que se equivoque hacia el lado estricto le rompe el acceso a alguien que hoy entra bien.

## Goals / Non-Goals

**Goals:**

- Que sea **imposible** quedar con contraseña guardada y sin marca de activación, o al revés.
- Que ningún socio que hoy entra bien pierda el acceso ni sea forzado a redefinir su contraseña.
- Que el estado de activación sea una **métrica real** y no una inferencia estadística.
- Cero cambios de esquema, cero migraciones, cero RLS nueva.

**Non-Goals:**

- Convertir la marca de activación en un control de seguridad. Es una guía de experiencia y una métrica.
- Rescatar automáticamente a las cuentas que caigan en `SIN_CONTRASENA`. Se les reenvía desde el panel, a mano. (Al 2026-09-04 no hay ninguna.)
- Rediseñar `/auth/set-password`, `/auth/callback` ni la traducción de errores.
- Unificar `Profesional.status` con el estado de cuenta. Son dos cosas distintas y quedan distintas.

## Decisions

### D1 — La marca vive en `user_metadata`, escrita en la misma llamada que la contraseña

`updatePassword` pasa a ser:

```ts
await supabase.auth.updateUser({ password, data: { activacion_completada_en: ahora } });
```

**Por qué `user_metadata` y no `app_metadata`:** `app_metadata` sólo se escribe con service role, o sea `supabaseAdmin.auth.admin.updateUserById()`. Eso son **dos llamadas** — una para la contraseña, otra para la marca — y por lo tanto dos maneras nuevas de quedar a mitad de camino. Sería reemplazar el bug por una variante más difícil de diagnosticar. `user_metadata` viaja en el mismo `updateUser` y es atómico contra el servidor de Auth.

**Por qué no una columna en Prisma:** una escritura en Postgres después del `updateUser` es, otra vez, dos operaciones sin transacción común entre dos sistemas distintos. Además obligaría a una migración y a RLS. La atomicidad es el punto entero del change; no se negocia por comodidad de query.

**El costo, asumido explícitamente:** `user_metadata` es escribible por el propio usuario con su token. Un socio podría marcarse activado sin definir contraseña. No gana nada: sigue sin poder autenticarse en `/login`, que es lo único que le da acceso duradero. Lo único que se saltea es su propia pantalla de activación, y el resultado es que se queda afuera. Por eso la marca se documenta como guía de UX y métrica, nunca como frontera de autorización — la frontera sigue siendo tener contraseña.

**Formato:** `activacion_completada_en` con timestamp ISO-8601 UTC, no un booleano. Un booleano responde "sí/no"; el timestamp además responde "cuándo", que es la métrica de activación que el Círculo no tiene. Se acompaña de `activacion_origen: "usuario" | "backfill"` para poder separar lo medido de lo inferido.

**Idempotencia:** `updateUser({ data })` hace merge superficial sobre `raw_user_meta_data`, así que las claves no mencionadas sobreviven. Aun así, `updatePassword` lee primero el usuario y **omite la clave si ya existe**, para que un cambio de contraseña posterior no pise la fecha de activación original. Si esa lectura falla, se escribe igual: perder fidelidad en la métrica es preferible a no marcar la activación.

### D2 — Retrocompatibilidad: backfill autoritativo por `auth.users.encrypted_password`

**Esta es la decisión crítica del change.** El guard trata "sin marca" como "sin activar". Hoy nadie tiene marca, ni siquiera los 49 socios que entran perfectamente. Sin reconciliación previa, el fix le rompe el acceso a los que funcionan.

**La regla elegida:** una cuenta tiene contraseña propia si y sólo si `auth.users.encrypted_password` no es nulo ni vacío. `inviteUserByEmail` crea la identidad sin contraseña; `resetPasswordForEmail` tampoco la escribe. La columna se llena únicamente cuando alguien completó `updateUser({ password })` o un `signUp` con contraseña. Es decir: **`encrypted_password` no lisa es exactamente el predicado "activación completada"**, medido, no estimado.

**Alternativas descartadas:**

| Alternativa | Por qué no |
|---|---|
| Heurística de delta `updated_at − last_sign_in_at` (la que usaba el script de diagnóstico) | **Medida y descartada con datos.** Un socio que activó bien y volvió a entrar más tarde muestra delta ≈ 0, porque ese login nuevo pisa ambos timestamps: es indistinguible de quien nunca definió contraseña. Aplicada al padrón el 2026-09-04 reportó 11 socios rotos sobre 11 — **100% de falsos positivos**. No sirve ni para contar. |
| Fecha de corte: "sin marca y creado antes de X" ⇒ activado | 195 de los 244 invitados nunca ingresaron. Un corte por fecha los exime a todos del guard, o sea el fix no protege a la mayoría de la población para la que existe. Deja el agujero abierto para el 81% del padrón. |
| Ausencia de marca ⇒ activado (guard sólo para cuentas nuevas) | Mismo problema, llevado al extremo: el guard nace como no-op para todo el mundo que existe hoy. |
| No backfillear y aceptar que los activados redefinan su contraseña | El que reingresa su contraseña actual recibe `same_password` y queda trabado en una pantalla que le dice que elija otra. Convertir a 49 personas que hoy funcionan en 49 llamados telefónicos, sin ningún caso roto que arreglar a cambio, es puro costo. |

**Cómo se ejecuta:** lectura de `encrypted_password` por SQL crudo (`prisma.$queryRawUnsafe` contra `auth.users`, el mismo mecanismo que ya usa `scripts/listar-socios-en-limbo.ts`), y **escritura por la Admin API** (`supabaseAdmin.auth.admin.updateUserById`). No se hace `UPDATE` directo sobre `auth.users`: es un esquema gestionado por Supabase y escribirle a mano se sale del contrato soportado. Leerlo no. La marca se backfillea con `updated_at` de la cuenta como instante y `activacion_origen: "backfill"`.

### D3 — El guard se aplica en el middleware y se repite en el layout, sobre un helper puro

```
src/lib/activacion.ts
  export const CLAVE_ACTIVACION = "activacion_completada_en";
  export function activacionCompletada(user: User | null): boolean
  export function requiereActivacion(user: User | null): boolean   // !admin && !activado
```

Funciones puras sobre el objeto `User`: sin I/O, sin Supabase, sin Next. Testeables con un objeto literal en vitest, que es el estilo de `src/lib/auth-errores.ts` y de su suite.

**Middleware** (`src/utils/supabase/middleware.ts`) — el choke point. Ya llama `supabase.auth.getUser()`, así que el guard no agrega ni una request. Cubre `/mi-panel` y todas sus subrutas y server actions de una sola vez.

**Layout** (`src/app/mi-panel/layout.tsx`) — misma verificación, sobre `getAuthUser()` que ya se invoca ahí y está deduplicado por `cache` de React. Cuesta cero requests extra.

**Por qué en los dos lugares:** la guía de Next es explícita en que el middleware es una optimización y no debe ser el único punto de control. Es la misma línea de una función pura en ambos lados; la duplicación es nominal y el modo de falla que evita (una ruta que por matcher o por deploy no pase por el middleware) es un socio sin contraseña navegando el portal.

**Frescura del dato:** `supabase.auth.getUser()` valida contra el servidor de Auth y devuelve `user_metadata` actual, no el contenido del JWT cacheado. Por eso el socio que acaba de activar entra en la misma navegación, sin necesidad de refrescar sesión.

**Análisis del ciclo:**

```
sin sesión        → /mi-panel        → middleware → /login                (regla existente, corre primero)
sesión, sin marca → /mi-panel        → middleware → /auth/set-password
sesión, sin marca → /auth/set-password → no es /mi-panel ni /admin → pasa   ← no hay ciclo
guarda password   → marca escrita    → redirect /mi-panel → guard pasa
```

El orden importa: la regla de "sin sesión → /login" se evalúa **antes** que el guard, para que un visitante anónimo no termine en `/auth/set-password`, donde no tendría sesión que actualizar y sólo cosecharía `sesion_vencida`.

### D4 — Los administradores quedan exentos

Condición del guard: `!esAdmin && !activacionCompletada(user)`. Un admin (`app_metadata.role === "admin"`) nunca pasa por el flujo de invitación de socio, así que su cuenta jamás va a tener la marca por vía natural. Someterlo al guard es arriesgar el bloqueo de la cuenta de mayor privilegio del sistema a cambio de nada. El backfill igualmente les escribe la marca si tienen contraseña, con lo cual la exención rara vez se ejerce; queda como red de seguridad.

### D5 — `EstadoInvitacion` gana `SIN_CONTRASENA`; `ACTIVADO` pasa a significar lo que dice

`InvitacionRepository.getResumen()` ya trae los `User` completos vía `listUsers`, y el objeto `User` incluye `user_metadata`. **No hace falta ninguna consulta nueva ni tocar `traerUsuariosAuth()`**: la marca ya viene en la respuesta que se está pidiendo.

Clasificación nueva:

| Condición | Estado | Significado |
|---|---|---|
| `userId` nulo, con email | `SIN_INVITAR` | sin cambios |
| `userId` nulo, sin email | `SIN_EMAIL` | sin cambios |
| `userId` apunta a cuenta inexistente | `HUERFANO` | sin cambios |
| con marca de activación | `ACTIVADO` | **cambia**: ahora significa "tiene contraseña" |
| sin marca, con `email_confirmed_at \|\| last_sign_in_at` | `SIN_CONTRASENA` | **nuevo**: entró, no activó. Hoy da 0; existe para detectar el primer caso el día que ocurra |
| sin marca, sin ingreso | `EN_LIMBO` | conserva su significado: nunca entró |

Se mantiene `EN_LIMBO` con su semántica actual en vez de reciclar el nombre, aunque en la conversación del equipo "en limbo" se venía usando para el caso nuevo. Reusar la etiqueta cambiaría en silencio el sentido de un número que el Círculo ya viene mirando; un estado nuevo con nombre propio deja el cambio visible.

`ResumenInvitaciones` suma `sinContrasena: number`. Es un campo agregado, no un rename: los consumidores existentes siguen compilando.

### D6 — Rescate de los `SIN_CONTRASENA`: manual, sobre lo que ya existe

`BotonReenviar` en `/admin/invitaciones` hoy sólo se muestra para `EN_LIMBO` (línea 314 de `page.tsx`). Pasa a mostrarse también para `SIN_CONTRASENA`. `reenviarInvitacion` funciona tal cual para este caso: `generateLink({ type: "invite" })` regenera el token de una identidad existente, que es exactamente la situación de estas cuentas.

**Por qué no un reenvío masivo:** mandar mails es irreversible y va a inboxes de personas reales; Resend y Supabase tienen límites de tasa que harían fallar parte de un lote en silencio; y un botón de "reenviar a todos" en un panel de administración es un accidente esperando ocurrir. Los casos van a llegar de a uno, no en lote. Gobernanza CRITICAL: la acción irreversible la dispara una persona, una vez, con el nombre a la vista.

### D7 — Sin cambios en el esquema de Prisma

**`prisma/schema.prisma` no se toca. No hay `prisma db push`, no hay migración, no hay `ENABLE ROW LEVEL SECURITY`.** El único almacenamiento nuevo es la clave `activacion_completada_en` dentro de `auth.users.raw_user_meta_data`, que es de Supabase Auth. La lectura administrativa de todo el padrón se hace con el cliente service role, que no está sujeto a RLS y ya está en uso (`src/lib/supabase/admin.ts`).

### D8 — Desglose de UI

Cambios chicos y contenidos; no se crea ningún componente nuevo.

| Nivel | Elemento | Cambio |
|---|---|---|
| Átomo | Badge de estado (`ESTADOS` en `admin/invitaciones/page.tsx`) | Entrada `SIN_CONTRASENA`: etiqueta "Sin contraseña", `bg-orange-100 text-orange-700`, ayuda "Entró por el link pero nunca guardó su contraseña. No va a poder volver a entrar." |
| Átomo | Tarjeta de métrica | Sexta tarjeta con `sinContrasena`, icono `KeyRound`, `text-orange-600` |
| Molécula | `BotonReenviar` | Se renderiza también para `SIN_CONTRASENA`; sin cambios internos |
| Página | `/auth/set-password` | Copy que reconozca al socio que vuelve: hoy dice "Tu solicitud ha sido aprobada", que a un socio devuelto por el guard le suena a error |
| — | `/mi-panel` | Sin cambios visuales; el guard actúa antes de renderizar |

Paleta y radios existentes; naranja para "necesita acción del socio", coherente con el ámbar de `EN_LIMBO` y sin chocar con el rojo de `HUERFANO`. Nada de píxeles fijos.

## Risks / Trade-offs

**[La ventana entre el backfill y el deploy]** Un socio que activa entre el backfill y el deploy queda con contraseña y sin marca, y el guard lo manda a redefinirla. → El backfill se corre **dos veces**: antes del deploy y otra vez inmediatamente después. Es idempotente por diseño. La segunda pasada cierra la ventana; su duración práctica son minutos, contra una población que activa unas pocas cuentas por día.

**[`user_metadata` es escribible por el usuario]** → Aceptado y documentado en la spec. No otorga ningún privilegio: sin contraseña no hay login. Si en algún momento la activación tuviera que ser una frontera real, la migración es mover la marca a `app_metadata` y aceptar la no-atomicidad con una reconciliación periódica — no hace falta hoy.

**[`encrypted_password` es una columna interna de Supabase]** Podría cambiar de nombre o de semántica en una versión futura de GoTrue. → Se lee **una sola vez**, desde un script de un solo uso, no desde código de producción. Si el día de mañana desaparece, el backfill ya corrió y nada del runtime depende de ella. El script falla ruidosamente si la consulta no devuelve la columna.

**[Un falso negativo del backfill traba a un socio con `same_password`]** Si por lo que fuera una cuenta con contraseña no recibe la marca, su dueño va a `/auth/set-password`, tipea su contraseña de siempre y recibe "esa es la que ya tenías". → El mensaje ya existe y ya explica qué hacer (`src/lib/auth-errores.ts`), y el modo de falla es "elegí otra contraseña", no un bloqueo. El `--dry-run` obligatorio antes de escribir permite comparar el conteo contra la línea de base medida ese mismo día y detectar la discrepancia antes de desplegar.

**[Los números de `/admin/invitaciones` cambian el día del deploy]** El total de activados **no debería moverse** (49 al 2026-09-04, antes y después), porque hoy todos los que entraron tienen contraseña. Lo que aparece es una columna nueva en 0. Si al desplegar "activados" baja, significa que el backfill dejó cuentas afuera → investigar antes de seguir, no aceptarlo como el número nuevo.

**[`getUser()` en el middleware valida contra el servidor en cada request]** → Ya se hace hoy, en la misma línea. El guard no agrega latencia.

**[Doble verificación middleware + layout]** Un poco de duplicación. → Es una llamada a una función pura en cada lado. El costo es tipográfico; el beneficio es que el portal no queda a merced de que el matcher del middleware esté bien.

## Migration Plan

Orden estricto. Los pasos 2 y 5 son la misma operación idempotente.

1. **Merge del código con el guard desactivable.** El guard va en el código, pero el despliegue no ocurre hasta el paso 3.
2. **`npx tsx scripts/backfill-activacion.ts --dry-run`** en producción. Se esperan **tantas cuentas a marcar como contraseñas haya, y 0 sin contraseña entre las que ingresaron**. Al 2026-09-04 eran 49, pero el número **se mueve solo** — subió de 47 a 49 en unas horas mientras se implementaba el change. Medí la línea de base con `scripts/listar-socios-en-limbo.ts` el mismo día y compará contra eso, nunca contra el número escrito acá. **Si el número no cierra, parar acá.** Esta es la puerta de calidad del change.
3. **`npx tsx scripts/backfill-activacion.ts --escribir`** (escritura). El modo por defecto es el ensayo: sin el flag no escribe nada.
4. **Deploy.**
5. **Backfill de nuevo** (segunda pasada, cierra la ventana del paso 3→4).
6. **Verificar `/admin/invitaciones`**: activados igual que antes del deploy (≈ 49 al 2026-09-04), sin contraseña en 0, y el total de invitados sin cambios. Que activados **no** baje es la señal de que el backfill cubrió a todos.
7. **Si aparece alguna cuenta `SIN_CONTRASENA`**, reenviarle el enlace desde el panel, una por una. Al 2026-09-04 no hay ninguna, así que este paso probablemente sea un no-op.

**Rollback:** revertir el deploy. Sin migraciones que deshacer y sin estado que restaurar. La marca en `user_metadata` es aditiva e inerte: código que no la lee se comporta exactamente como antes del change. No hace falta limpiarla, y conviene no hacerlo — si se vuelve a desplegar, el backfill ya está hecho.

**Verificación posterior:** una semana después, `sinContrasena` debería tender a cero y no aparecer casos nuevos. Si aparecen, el guard no está cubriendo algún camino de entrada y hay que revisar el matcher del middleware.

## Open Questions

- **Copy exacto de `/auth/set-password` para el socio devuelto por el guard.** Hoy dice "Tu solicitud ha sido aprobada", que no aplica a quien vuelve por segunda vez. No cambia specs, approach ni tareas: es texto, y lo mejor es que lo apruebe el Círculo.
- **Si conviene mostrar `SIN_CONTRASENA` también en `/admin/profesionales`.** Ese panel muestra `Profesional.status` (padrón), no estado de cuenta; mezclarlos ahí puede confundir más de lo que ayuda. Se puede decidir después de ver el panel de invitaciones corregido en uso.
