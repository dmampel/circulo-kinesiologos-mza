## Why

El change `notificacion-solicitud-completa` reescribió el aviso institucional de nueva solicitud: ahora lleva los nueve datos del solicitante, enlaces firmados a su documentación y el botón de WhatsApp para avisarle a la dueña del producto. Pero ese aviso sólo se dispara **al crear la solicitud**.

Las solicitudes que entraron **antes** de ese cambio ya gastaron su único envío: administración recibió la plantilla vieja —cuatro datos y un botón a un panel al que no tiene acceso— y esos avisos no se pueden regenerar. Hoy la única salida es exportar la ficha a mano o pedirle a alguien con rol `admin` que lea la solicitud y la reenvíe por otro canal. Hay solicitudes paradas por eso.

Hace falta poder **volver a emitir el aviso completo** para una solicitud ya guardada, desde el panel, con los datos reales de esa persona y enlaces frescos a sus documentos.

## What Changes

- Se agrega una acción de **reenvío del aviso institucional** para una solicitud existente. Toma los datos ya persistidos en `Solicitud` y en `Solicitud.datos`, resuelve localidad y especialidades a nombres, firma enlaces nuevos a la documentación real que esa persona subió, arma el mail con el mismo constructor que usa el registro, y lo envía a `INSTITUTIONAL_EMAIL`.
- Se agrega un **botón "Reenviar aviso a administración"** en el detalle de la solicitud (`/admin/solicitudes/[id]`), con confirmación previa, deshabilitado mientras la operación está en curso, y resultado visible.
- El reenvío está disponible **para cualquier estado** de la solicitud (`PENDIENTE`, `APROBADA`, `RECHAZADA`): es un mail informativo que no muta estado, y el caso de uso real —recuperar el aviso de una solicitud vieja— no está atado a que siga pendiente.
- La resolución de **localidad + especialidades a nombres legibles**, hoy escrita inline dentro de `crearSolicitud`, se extrae a un helper compartido reutilizado por el registro y por el reenvío, para que ambos caminos produzcan exactamente el mismo texto y una sola query.
- El reenvío **no muta nada**: no cambia `status`, no toca `revisada_en`, no crea registros, no manda mail al solicitante.
- Acceso restringido a admin, con el mismo `requireAdmin()` que ya protege el resto de `/admin`.

**No hay cambios de base de datos**: ningún campo nuevo en Prisma, ninguna tabla, ninguna migración de Supabase, ninguna política RLS nueva, ninguna dependencia nueva. Toda la información ya está persistida.

### Fuera de alcance (no cambia)

- `crearSolicitud` conserva su comportamiento observable: el único cambio es que la resolución de nombres pasa a llamarse desde el helper compartido en vez de estar inline.
- `gestionarSolicitud` (aprobar/rechazar) y sus mails al profesional.
- El mail de confirmación al solicitante y el aviso institucional automático del registro.
- La vigencia de 1 hora que usa el panel para ver documentos in-app (`firmarUrlsDocumentos` sin segundo argumento) queda igual.
- No se registra historial de reenvíos ni se agrega auditoría: no hay tabla ni campo donde guardarlo, y agregarlo obligaría a una migración que este change explícitamente no quiere.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `email-transaccional`: se agrega el contrato del **reenvío manual** del aviso institucional para una solicitud ya persistida — quién puede dispararlo, qué estados admite, de dónde salen los datos y los enlaces, que no muta la solicitud, y cómo se comporta ante fallos de configuración de mail, de Storage o del proveedor. Hoy la capability describe el aviso institucional como un efecto exclusivo de la creación de la solicitud.

## Impact

**Código afectado:**

- Nuevo módulo compartido para resolver `localidadId` + IDs de especialidad a nombres legibles (hoy inline en `src/app/registro/actions.ts`, líneas ~189-207).
- `src/app/registro/actions.ts` — `crearSolicitud`: pasa a usar ese helper. Sin cambio de comportamiento.
- `src/app/admin/solicitudes/actions.ts` — nueva server action de reenvío, con `requireAdmin()` y contrato `{ success: boolean; error?: string }`.
- `src/app/admin/solicitudes/BotonesSolicitud.tsx` o un componente cliente hermano — nuevo botón en el detalle.
- `src/app/admin/solicitudes/[id]/page.tsx` — monta el botón nuevo.
- Reutiliza sin modificar: `construirAvisoInstitucional` (`src/lib/emails/solicitud-institucional.ts`), `firmarUrlsDocumentos` + `SIGNED_URL_TTL_EMAIL_SEGUNDOS` (`src/lib/storage/solicitudes.ts`), los helpers de `src/lib/whatsapp.ts`, `DOCUMENTOS_SOLICITUD` (`src/lib/solicitudes/ficha.ts`), `normalizarEspecialidadesSolicitud` (`src/lib/especialidades.ts`) y `getResend`/`canSendEmails`/`FROM_EMAIL`/`INSTITUTIONAL_EMAIL` (`src/lib/resend.ts`).
- Tests: nuevos para el helper compartido de resolución de nombres, y extensión de `src/app/admin/solicitudes/actions.test.ts` para la server action.

**Sin impacto:** Prisma schema, migraciones Supabase, RLS, visibilidad del bucket `solicitudes`, `package.json`, variables de entorno.

**Riesgo de privacidad heredado:** el mail reenviado lleva enlaces firmados de 7 días a documentación personal (DNI, título, seguro, CV). Es exactamente el mismo riesgo que ya aceptó `notificacion-solicitud-completa`; lo que este change agrega es que ahora ese mail puede emitirse a demanda, y no una sola vez. Sólo un admin autenticado puede dispararlo, y siempre hacia `INSTITUTIONAL_EMAIL` — el destinatario nunca es un parámetro.

**Deuda preexistente detectada** (no introducida por este change): `npx tsc --noEmit` falla hoy en `src/lib/emails/solicitud-institucional.test.ts:19` — el test pasa `panelUrl`, propiedad que no existe en `DatosAvisoInstitucional` (el botón al panel se descartó en la implementación final del change anterior, pero quedó en el fixture del test). Se corrige en este change porque bloquea la verificación de tipos.
