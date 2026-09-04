# Tasks — activacion-cuenta-socio

Referencias: `specs/activacion-cuenta-socio/spec.md` (qué), `design.md` (cómo).
Gobernanza **CRITICAL**: toca la autenticación de 244 personas reales. Nada de este change
modifica cuentas de Supabase hasta el grupo 6, y ese grupo empieza con un ensayo sin escritura.

## 1. Base de datos y Prisma

- [x] 1.1 Confirmar que `prisma/schema.prisma` **no se modifica**: la marca de activación vive en `auth.users.raw_user_meta_data` (Supabase Auth), fuera del alcance del ORM. Dejarlo asentado en el PR — no corre `prisma db push`, no hay migración, no hay `ENABLE ROW LEVEL SECURITY` que agregar (design D7).
- [x] 1.2 Verificar contra la base de producción que `prisma.$queryRawUnsafe` puede leer `auth.users.encrypted_password` con la `DATABASE_URL` actual, igual que ya lee `auth.users` en `scripts/listar-socios-en-limbo.ts`. Si no tiene permiso, **parar y avisar**: el backfill del grupo 3 depende de esta lectura.
- [x] 1.3 Contar, sólo leyendo, cuántas cuentas tienen `encrypted_password` no nulo ni vacío y cuántas no. Guardar el número: es la línea de base contra la que se valida el backfill. Referencia del 2026-09-04: **49 con contraseña, 195 sin, 0 que hayan ingresado sin contraseña**. Este número **se mueve solo**: durante la implementación de este change pasó de 47 a 49 en unas horas, porque los socios siguen activando. **La línea de base válida es la que midas el día del despliegue**, no la de acá. Reconfirmar con `npx tsx scripts/listar-socios-en-limbo.ts`.

## 2. Supabase Auth — la marca de activación

- [x] 2.1 Crear `src/lib/activacion.ts` con la constante `CLAVE_ACTIVACION = "activacion_completada_en"`, la clave `activacion_origen`, y las funciones puras `activacionCompletada(user: User | null): boolean` y `requiereActivacion(user: User | null): boolean` (esta última: no es admin **y** no está activada). Sin I/O, sin imports de Next ni de Supabase más allá del tipo `User`. Tipado estricto, sin `any`.
- [x] 2.2 Crear `src/lib/activacion.test.ts` con casos: usuario con marca, usuario sin marca, usuario `null`, admin sin marca (no requiere activación), marca presente pero vacía o malformada (no cuenta como activada). Estilo de `src/lib/auth-errores.ts` y su suite.
- [x] 2.3 Modificar `updatePassword` en `src/app/auth/actions.ts` para que la llamada sea `updateUser({ password, data })`, en **una sola** operación (design D1). `data` incluye `activacion_completada_en` (ISO-8601 UTC) y `activacion_origen: "usuario"`.
- [x] 2.4 En `updatePassword`, leer el usuario actual antes del `updateUser` y **omitir** `activacion_completada_en` si ya existe, para no pisar la fecha original cuando un socio ya activado cambia su contraseña. Si la lectura falla, escribir la marca igual (design D1, "Idempotencia").
- [x] 2.5 Confirmar que ante error de `updateUser` no queda ninguna escritura parcial: el redirect con el código de error sigue exactamente como está, y la marca no se escribe por ningún otro camino.
- [x] 2.6 Extender `src/app/auth/actions.test.ts` manteniendo su estilo (mocks de `updateUser` y de `redirect` ya existen): que el `updateUser` exitoso reciba `password` **y** `data` en la misma llamada; que ante `same_password`, `weak_password` y `session_not_found` no se escriba marca y el destino siga siendo el actual; que una cuenta ya marcada conserve su fecha original.

## 3. Supabase Auth — backfill de las cuentas existentes

- [x] 3.1 Crear `scripts/backfill-activacion.ts`: lee por SQL las cuentas con `encrypted_password` no vacío y sin `activacion_completada_en`; escribe la marca vía `supabaseAdmin.auth.admin.updateUserById` (nunca `UPDATE` directo sobre `auth.users`), con `activacion_origen: "backfill"` y el `updated_at` de la cuenta como instante (design D2).
- [x] 3.2 Implementar `--dry-run` como modo que informa cuántas cuentas modificaría y cuáles, **sin escribir nada**. Que sea el modo por defecto si se pasa el flag, y que la ejecución con escritura sea explícita.
- [x] 3.3 Hacerlo idempotente: sólo escribe donde la marca está ausente. Una segunda pasada debe reportar cero cambios sobre las cuentas ya marcadas.
- [x] 3.4 Que falle ruidosamente si la consulta no devuelve `encrypted_password` (columna interna de Supabase que podría cambiar), en vez de marcar cero cuentas en silencio.
- [x] 3.5 Imprimir un resumen final: cuentas con contraseña, cuentas sin contraseña, marcas escritas, marcas ya presentes, errores por cuenta. Es lo que se compara contra la línea de base de 1.3.
- [x] 3.6 Commitear `scripts/listar-socios-en-limbo.ts` (ya reescrito sobre `encrypted_password`, hoy sin commitear). Verificar que sigue coincidiendo con lo que decide el backfill y **no reintroducir la heurística de delta**: está documentada como descartada dentro del propio script, dio 100% de falsos positivos.

## 4. Backend — guard de acceso y estado real en el repositorio

- [x] 4.1 En `src/utils/supabase/middleware.ts`, agregar el guard: si hay usuario, la ruta es `/mi-panel` y `requiereActivacion(user)`, redirigir a `/auth/set-password`. Colocarlo **después** de la regla de "sin sesión → `/login`" (design D3, análisis del ciclo).
- [x] 4.2 Verificar que `/auth/set-password` no queda alcanzada por el guard y que no se arma ciclo: `sesión + sin marca → /mi-panel → /auth/set-password → pasa`. Probar también admin sin marca (entra) y visitante sin sesión (va a `/login`).
- [x] 4.3 En `src/app/mi-panel/layout.tsx`, aplicar el mismo `requiereActivacion` sobre el `user` que ya devuelve `getAuthUser()`, antes de cualquier consulta a repositorios. Defensa en profundidad, sin requests extra (design D3).
- [x] 4.4 En `src/lib/repositories/InvitacionRepository.ts`, agregar `SIN_CONTRASENA` al tipo `EstadoInvitacion` y `sinContrasena: number` a `ResumenInvitaciones` (campo agregado, no rename: los consumidores existentes deben seguir compilando).
- [x] 4.5 Reescribir la clasificación de `getResumen()` según la tabla de design D5: `ACTIVADO` pasa a ser "tiene marca de activación"; `SIN_CONTRASENA` es "sin marca pero con `email_confirmed_at || last_sign_in_at`"; `EN_LIMBO` conserva su significado de "nunca entró". `HUERFANO`, `SIN_INVITAR` y `SIN_EMAIL` no cambian.
- [x] 4.6 Confirmar que **no hace falta ninguna consulta nueva**: `listUsers` ya devuelve `user_metadata` en el objeto `User`. No tocar `traerUsuariosAuth()` ni su paginado.
- [x] 4.7 Revisar `agruparEnTandas`: las tandas cuentan `entraron` con `estado === "ACTIVADO"`. Decidir y aplicar si `SIN_CONTRASENA` cuenta como "entró" (entró, pero no activó) y dejar el criterio comentado, porque el porcentaje por tanda cambia según la respuesta.
- [x] 4.8 Extender `src/lib/repositories/InvitacionRepository.test.ts` con: cuenta con marca → `ACTIVADO`; cuenta con `last_sign_in_at` y sin marca → `SIN_CONTRASENA`; cuenta invitada sin ingreso y sin marca → `EN_LIMBO`; `userId` apuntando a cuenta inexistente → `HUERFANO` (no se clasifica por activación); y que `sinContrasena` cuadre en el resumen.

## 5. Frontend — panel de administración y copy

- [x] 5.1 En `src/app/admin/invitaciones/page.tsx`, agregar la entrada `SIN_CONTRASENA` al record `ESTADOS`: etiqueta "Sin contraseña", clases `bg-orange-100 text-orange-700`, ayuda "Entró por el link pero nunca guardó su contraseña. No va a poder volver a entrar." (design D8).
- [x] 5.2 Agregar la tarjeta de métrica de `sinContrasena` junto a las existentes, con icono `KeyRound` y `text-orange-600`, filtrable como las demás.
- [x] 5.3 Cambiar la condición de renderizado de `BotonReenviar` para que se muestre en `EN_LIMBO` **y** en `SIN_CONTRASENA`. `reenviarInvitacion` sirve tal cual para ambos casos; no modificarla.
- [x] 5.4 Actualizar el copy de `src/app/auth/set-password/page.tsx`: hoy dice "Tu solicitud ha sido aprobada", que al socio devuelto por el guard le suena a error. Redactar un texto que sirva tanto para el que activa por primera vez como para el que vuelve. **Consultarlo con el Círculo antes de fijarlo** (design — Open Questions).
- [x] 5.5 Verificar responsive de la fila y de la grilla de métricas con la sexta tarjeta: sin píxeles fijos, escalas de Tailwind y tipografía fluida.
- [x] 5.6 Confirmar que no se agregó ningún `"use client"` innecesario: `page.tsx` sigue siendo Server Component y el único cliente es `BotonReenviar`, que ya lo era.

## 6. Verificación y despliegue

- [x] 6.1 Correr `npx vitest run` completo. Ningún test existente puede romperse; `src/app/auth/callback/route.test.ts` y `src/app/auth/set-password/page.test.tsx` deben seguir en verde sin cambios.
- [x] 6.2 Limpiar `console.log` de depuración (los del script de backfill son salida intencional y se quedan).
- [x] 6.3 **Puerta de calidad.** Correr `npx tsx scripts/backfill-activacion.ts --dry-run` contra producción y comparar contra la línea de base de 1.3: las cuentas a marcar deben coincidir **exactamente** con las que 1.3 contó ese mismo día (referencia del 2026-09-04: 49) y las que ingresaron sin contraseña deben ser **0**. No compares contra el número escrito en este documento: compará contra tu propia medición del día. **Si no cierra, parar el despliegue y reportar** — de menos significa que hay socios en funcionamiento que el backfill no va a cubrir, y esos son los que quedan trabados.
- [x] 6.4 Correr el backfill con escritura: `npx tsx scripts/backfill-activacion.ts --escribir`. El modo por defecto es el ensayo; la escritura exige el flag explícito.
- [x] 6.5 Desplegar.
- [x] 6.6 Correr el backfill una segunda vez, inmediatamente después del deploy, para cerrar la ventana entre 6.4 y 6.5 (design — Migration Plan). **Ejecutado el 2026-09-04**: primera pasada 49 marcas escritas / 0 errores; segunda pasada 49 con marca previa / 0 a marcar. Idempotencia confirmada contra producción.
- [ ] 6.7 Verificar en `/admin/invitaciones` que activados **no bajó** respecto de antes del deploy (≈ 49 al 2026-09-04), que aparece la columna nueva en 0 y que el total de invitados no cambió. Si activados baja, el backfill dejó cuentas afuera: investigar antes de seguir. Avisarle al Círculo que aparece una métrica nueva.
- [ ] 6.8 Probar el flujo completo end-to-end con una cuenta de prueba: invitar → abrir el link → **no** guardar contraseña → intentar `/mi-panel` → debe redirigir a `/auth/set-password` → guardar contraseña → debe entrar al portal → cerrar sesión → volver a entrar por `/login` con esa contraseña.
- [ ] 6.9 Si el panel muestra alguna cuenta `SIN_CONTRASENA`, reenviarle el enlace desde el panel, una por una. Sin envíos masivos automáticos (design D6). Al 2026-09-04 no hay ninguna, así que lo más probable es que este paso sea un no-op.
- [ ] 6.10 A la semana, revisar que `sinContrasena` tienda a cero y que no aparezcan casos nuevos. Si aparecen, hay un camino de entrada al portal que el guard no cubre: revisar el matcher del middleware.
