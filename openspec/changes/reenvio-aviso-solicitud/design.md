## Context

Ver `proposal.md` — Why para la motivación. Lo que importa del estado actual:

**Lo que ya existe y se reutiliza tal cual** (implementado por `notificacion-solicitud-completa`, todavía sin commitear pero presente en el working tree):

| Módulo | Qué aporta |
|---|---|
| `src/lib/emails/solicitud-institucional.ts` | `construirAvisoInstitucional(datos: DatosAvisoInstitucional) → { subject, html }`. Función pura, sin I/O. Escapa todo valor de texto del solicitante. |
| `src/lib/storage/solicitudes.ts` | `firmarUrlsDocumentos(paths, ttl = SIGNED_URL_TTL_SEGUNDOS)` y `SIGNED_URL_TTL_EMAIL_SEGUNDOS = 604800`. Nunca lanza: si Storage falla, devuelve `{}`. |
| `src/lib/whatsapp.ts` | `WHATSAPP_ADMINISTRACION`, `construirLinkWhatsApp`, `mensajeNuevaSolicitud`. |
| `src/lib/solicitudes/ficha.ts` | `DOCUMENTOS_SOLICITUD`: catálogo ordenado de los 8 documentos (6 obligatorios + 2 opcionales) con `id` y `label`. |
| `src/lib/especialidades.ts` | `normalizarEspecialidadesSolicitud(datos)`: absorbe el formato viejo (`especialidad: string`) y el nuevo (`especialidades: string[]`). |
| `src/lib/resend.ts` | `canSendEmails()`, `getResend()`, `FROM_EMAIL`, `INSTITUTIONAL_EMAIL`. |
| `src/utils/supabase/require-admin.ts` | `requireAdmin()`: lanza `Unauthorized` / `Forbidden`. |

**Forma exacta del dato** (verificada en `prisma/schema.prisma`): `Solicitud` tiene columnas propias `id`, `status`, `nombre`, `apellido`, `email`, `matricula`, `creada_en`, `revisada_en`, y **un campo `datos Json`** con `{ dni, telefono, direccion, localidadId, especialidades, archivos, fecha_solicitud }`. `archivos` es un `Record<string, string>` de `id` del catálogo → path en el bucket privado `solicitudes`.

**Dónde vive hoy la resolución de nombres**: `src/app/registro/actions.ts`, líneas ~189-207, inline dentro de `crearSolicitud`, en un `try/catch` best-effort con `Promise.all([especialidad.findMany, localidad.findUnique])` y fallback `"No especificada"`. Es exactamente la lógica que el reenvío necesita.

**Restricciones de forma** (de `AGENTS.md` y `openspec/config.yaml`): Server Components por defecto, `"use client"` sólo para interactividad; server actions devuelven `{ success: boolean; error?: string }`; sin `any` en producción; vitest disponible (`npx vitest run`), `strict_tdd: false`.

**Estado del panel**: `src/app/admin/solicitudes/[id]/page.tsx` (Server Component, `force-dynamic`) monta `<BotonesSolicitud id={...} />`, que vive en `src/app/admin/solicitudes/BotonesSolicitud.tsx` — **no** dentro de `[id]/`, pese a que el detalle es su único consumidor real hoy. Es un componente cliente con `useState(isPending)`, `confirm()` previo y `alert()` para el error.

## Goals / Non-Goals

**Goals:**

- Una sola plantilla de aviso institucional para el registro y para el reenvío. Cambiar el mail en un lugar cambia ambos.
- Una sola implementación de la resolución localidad + especialidades → nombres.
- Que el reenvío sea seguro por construcción: no muta dominio, destinatario fijo, sólo admin.
- Que el fallo sea visible: el admin que aprieta el botón se entera si el mail no salió.

**Non-Goals:**

- No se unifica el *disparo* del aviso (el registro lo hace best-effort y silencioso; el reenvío falla ruidoso). Ver D5.
- No se generaliza a un "reenviar cualquier mail del sistema".
- No se persiste historial de reenvíos (requeriría migración; ver D6).
- No se rediseña `BotonesSolicitud`: se agrega, no se refactoriza.

## Decisions

### D1 — Sí, extraer el helper de resolución de nombres a un módulo compartido

**Decisión:** crear `src/lib/solicitudes/nombres.ts` con:

```ts
export const SIN_LOCALIDAD = "No especificada";

export type NombresSolicitud = { localidad: string; especialidades: string };

export async function resolverNombresSolicitud(datos: unknown): Promise<NombresSolicitud>
```

Recibe el JSON `datos` crudo, lee `localidadId` con guard de tipo, normaliza especialidades con `normalizarEspecialidadesSolicitud`, hace **un solo** `Promise.all([especialidad.findMany, localidad.findUnique])`, y devuelve strings ya listos para el mail. `try/catch` interno: nunca lanza; ante fallo devuelve los defaults. Nunca devuelve un ID.

`crearSolicitud` pasa a llamarlo en lugar de su bloque inline. El comportamiento observable no cambia — el helper es esa misma lógica movida, con la diferencia de que recibe `datos` en vez de variables sueltas y de que la búsqueda de especialidades resuelve **por id o por nombre** (`OR`), como ya hace la página de detalle, para cubrir las solicitudes viejas que guardaron nombres.

**Alternativas descartadas:**

- *Duplicar el bloque en la nueva action*: dos queries que tienen que producir el mismo texto y van a divergir al primer cambio de catálogo. Es exactamente el bug que ya produjo `especialidad` vs `especialidades`.
- *Exportar la función desde `registro/actions.ts`*: ese archivo es `"use server"`; todo export se vuelve un endpoint HTTP. Exportar un helper de lectura desde ahí es abrir superficie sin razón.
- *Ponerlo en `src/lib/especialidades.ts`*: ese módulo es puro y sin I/O; meterle Prisma le cambia la naturaleza y arrastra la DB a sus tests. Módulo nuevo.
- *Meterlo en un repositorio (`SolicitudRepository`)*: `AGENTS.md` manda que el acceso a datos pase por `src/lib/repositories/`. Acá se hace una excepción consciente y acotada: no existe un `SolicitudRepository`, la lectura es de catálogos (`Localidad`, `Especialidad`) y no de la entidad, y el helper es una función de presentación para mails, no una capa de datos. Si más adelante aparece un repositorio de catálogos, este helper se apoya en él sin cambiar su firma.

### D2 — El reenvío vive en `src/app/admin/solicitudes/actions.ts`, junto a `gestionarSolicitud`

Nueva server action:

```ts
export async function reenviarAvisoInstitucional(
  id: string,
): Promise<{ success: boolean; error?: string }>
```

Secuencia: `requireAdmin()` → `prisma.solicitud.findUnique({ where: { id } })` → si no existe, `{ success: false, error: "Solicitud no encontrada." }` → `canSendEmails()` → `resolverNombresSolicitud(datos)` → firmar documentos → `construirAvisoInstitucional` → `resend.emails.send` → `{ success: true }`.

Va en el archivo existente porque es el único módulo `"use server"` del admin de solicitudes y el consumidor es la misma pantalla. No hay `revalidatePath`: nada cambió en la base, revalidar sería ruido.

### D3 — Lectura del JSON `datos` con un guard tipado, no con `as any`

`gestionarSolicitud` hoy hace `const datos = solicitud.datos as any`. `AGENTS.md` prohíbe `any` en producción, así que el código nuevo **no** replica ese patrón. En su lugar, una función local en el módulo del reenvío:

```ts
type DatosSolicitud = {
  dni?: unknown; telefono?: unknown; direccion?: unknown;
  localidadId?: unknown; archivos?: unknown;
};

function texto(valor: unknown, fallback = "No especificado"): string
function archivosDe(datos: unknown): Record<string, string>
```

Esto no es cosmética: las solicitudes viejas son precisamente las que motivan el change, y son las que tienen más chance de traer un `datos` incompleto o con formas distintas. `texto()` cubre el escenario de spec "Datos ausentes en el snapshot de una solicitud vieja" sin dejar etiquetas vacías. No se toca el `as any` preexistente de `gestionarSolicitud` — está fuera de alcance.

### D4 — Reenvío habilitado para cualquier `status`

Aceptada la sugerencia de la dueña del producto. `gestionarSolicitud` tiene un guard `status !== "PENDIENTE"` que existe por un incidente real: un doble click reenvió un mail de rechazo a un solicitante. Ese guard protege de **mutar y notificar al solicitante dos veces**; ninguna de las dos cosas ocurre acá. El reenvío no muta y su destinatario es administración, no la persona.

Restringirlo a `PENDIENTE` rompería el caso de uso: hay solicitudes viejas ya aprobadas cuyo aviso original nunca llevó la documentación, y administración las sigue necesitando.

### D5 — El reenvío falla ruidoso; el aviso del registro sigue fallando silencioso

En `crearSolicitud` el aviso institucional está envuelto en un `try/catch` que se traga todo: correcto, porque el objetivo primario ahí es *que la solicitud quede creada*, y el usuario final no puede hacer nada con un error de Resend.

En el reenvío la relación se invierte: el envío **es** la operación. No hay nada más que salvar. Por lo tanto:

- `canSendEmails() === false` → `{ success: false, error: "El envío de mails no está configurado..." }`. Nunca un `success: true` falso.
- `resend.emails.send` rechaza → `{ success: false, error }`.
- Storage no firma → `firmarUrlsDocumentos` devuelve `{}` sin lanzar; **el mail se manda igual**, con todos los documentos marcados como no disponibles. Es la conducta ya especificada para el aviso automático y se mantiene: un aviso con datos y sin enlaces sigue siendo útil.

El `try/catch` externo captura cualquier excepción restante —incluidas las de `requireAdmin()`— y la convierte en `{ success: false, error }`, para que la página no reviente.

### D6 — Sin idempotencia en el servidor; sólo `disabled` en el cliente

No se agrega guard de doble envío. El único efecto de un doble disparo es un segundo mail idéntico a administración: molesto, no destructivo, y sin nada que revertir. La mitigación es de UI (`isPending` deshabilita el botón mientras la request corre), como pide el brief.

Guardar un timestamp de último reenvío para bloquear repeticiones exigiría una columna nueva en `Solicitud` → migración Prisma + `prisma db push` + RLS, que el proposal excluye explícitamente. Desproporcionado para el riesgo.

### D7 — El botón nuevo va en un componente cliente propio, no dentro de `BotonesSolicitud`

Nuevo `src/app/admin/solicitudes/[id]/BotonReenviarAviso.tsx`, con `"use client"`.

Razones para no meterlo en `BotonesSolicitud`:

- `BotonesSolicitud` está en `src/app/admin/solicitudes/` (nivel lista), no en `[id]/`. Meterle una acción exclusiva del detalle lo ata a una pantalla que no es su ubicación.
- Su `isPending` es único y compartido por aprobar y rechazar. Sumar una tercera acción con semántica distinta (no mutante, disponible en cualquier status) obligaría a partir el estado igual.
- Separado, el botón se monta con independencia del status mientras aprobar/rechazar mantienen su propia lógica.

**Patrón que sí se copia de `BotonesSolicitud`**, porque es el que la pantalla ya usa: `useState` para `isPending`, `confirm()` antes de disparar, `disabled={isPending}` con spinner `Loader2`, `alert()` para el resultado. Ícono `Send` o `MailCheck` de `lucide-react`. Estética: mismo lenguaje que el botón "Ficha" vecino (`rounded-2xl`, `border-slate-100`, `bg-white`, `h-12`), sin píxeles fijos.

Se monta en `[id]/page.tsx` en el cluster de acciones del header, entre "Ficha" y `<BotonesSolicitud />`. Confirmación: `"¿Reenviar el aviso completo de esta solicitud a administración?"`. Éxito: `alert("Aviso reenviado a administración.")` — sin confirmación explícita, el admin no tiene forma de saber si salió.

### D8 — Los documentos se arman igual que en `crearSolicitud`, leyendo del snapshot

```ts
const archivos = archivosDe(solicitud.datos);
const paths = DOCUMENTOS_SOLICITUD.map((d) => archivos[d.id]).filter(Boolean);
const urls = await firmarUrlsDocumentos(paths, SIGNED_URL_TTL_EMAIL_SEGUNDOS);
const documentos = DOCUMENTOS_SOLICITUD
  .filter((d) => Boolean(archivos[d.id]))
  .map((d) => ({ label: d.label, url: urls[archivos[d.id]] }));
```

Recorrer `DOCUMENTOS_SOLICITUD` y no `Object.keys(archivos)` preserva el orden del catálogo y evita que una clave espuria del snapshot viejo se cuele en el mail. Los no adjuntados no se listan; los adjuntados que Storage no pudo firmar quedan con `url: undefined` y el constructor los renderiza como "no disponible" — que es exactamente el escenario de spec del documento borrado del bucket.

**Edge case Supabase explícito:** `createSignedUrls` devuelve un array con un `error` por item; `firmarUrlsDocumentos` ya descarta esos items en vez de romper. Un documento borrado del bucket no aborta el reenvío.

### D9 — `panelUrl` se corrige, no se restaura

`npx tsc --noEmit` falla hoy en `src/lib/emails/solicitud-institucional.test.ts:19`: el fixture pasa `panelUrl`, propiedad que `DatosAvisoInstitucional` no declara. El botón al panel se descartó en la implementación final del change anterior (administración no tiene rol admin, así que el botón no le servía) y quedó el residuo en el test.

Se elimina `panelUrl` del fixture. No se restaura el botón: el proposal anterior lo justificó como "vía secundaria" pero la implementación decidió lo contrario, y este change no reabre esa decisión. Se corrige acá porque un `tsc` roto impide verificar el trabajo nuevo.

## Risks / Trade-offs

- **Un admin reenvía un aviso de una solicitud ya rechazada y administración cree que hay trabajo pendiente** → el aviso lleva los datos pero no el estado. Mitigación aceptada: el reenvío lo dispara un humano deliberadamente, con `confirm()` de por medio, y la pantalla desde la que lo hace muestra el status en grande. No se agrega el status al mail para no bifurcar la plantilla (D1/Goals).
- **Enlaces firmados de 7 días viajando a demanda** → riesgo heredado de `notificacion-solicitud-completa`, ya aceptado por la dueña del producto. Este change lo amplifica en frecuencia, no en naturaleza. Mitigación: sólo un admin autenticado dispara, y el destinatario es una constante de entorno, jamás un parámetro de la acción.
- **Extraer el helper toca `crearSolicitud`, que es código sensible y recién escrito** → el cambio es un movimiento de bloque con una sola diferencia funcional (buscar especialidades por id **o** nombre). Mitigación: los tests existentes de `registro/actions.test.ts` que cubren la resolución de nombres deben seguir en verde sin modificarse; si alguno hay que tocarlo, es señal de que el comportamiento cambió y hay que revisarlo.
- **El helper hace su propia query de catálogos y no pasa por `src/lib/repositories/`** → desvío consciente de un pilar de `AGENTS.md`, acotado y documentado en D1.
- **`alert()`/`confirm()` como UI de feedback** → no es la estética premium que pide `AGENTS.md`. Mitigación: es el patrón que la pantalla ya usa en `BotonesSolicitud`; introducir un sistema de toasts sólo para este botón dejaría dos lenguajes de feedback conviviendo en el mismo header. Si se moderniza, se moderniza toda la pantalla en otro change.

## Migration Plan

No hay migración de datos ni de schema. Despliegue normal: el botón aparece en el detalle y no altera ningún flujo existente. Rollback = revertir el commit; nada quedó persistido que haya que deshacer.

Variables de entorno: ninguna nueva. El reenvío depende de `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `INSTITUTIONAL_EMAIL`, ya requeridas por el registro.
