## Why

Cuando llega una solicitud de asociación, el aviso institucional que recibe administración (`INSTITUTIONAL_EMAIL`) trae sólo cuatro datos —nombre, matrícula, email y especialidad— y un botón que lleva a `/admin/solicitudes`. Ese panel exige sesión de Supabase con `role === "admin"`, y **el personal de administración no tiene ese acceso**: hoy reciben un aviso que no pueden accionar. La solicitud queda parada hasta que alguien con permisos de admin la mira, cosa que en la práctica no pasa.

El aviso tiene que ser autosuficiente: administración debe poder leer la solicitud completa y ver la documentación desde el propio mail, sin loguearse, y avisarle a la dueña del producto con un toque para que se apruebe.

## What Changes

- El mail institucional de nueva solicitud pasa a incluir **todos** los datos del solicitante: nombre, apellido, matrícula, email, DNI/CUIL, teléfono, dirección, localidad y especialidad(es).
- El mail incluye **enlaces directos a los documentos** subidos a Supabase Storage (los 6 obligatorios y los 2 opcionales, cuando estén). Como el bucket `solicitudes` es privado, los enlaces se firman con vigencia extendida para que funcionen desde el cliente de correo sin sesión.
- El mail incluye un **botón de WhatsApp click-to-chat** (`https://wa.me/...`) con un mensaje pre-armado dirigido a la dueña del producto: administración lo toca y le avisa que hay una solicitud nueva para aprobar.
- Se mantiene el botón al panel administrativo como vía secundaria para quien sí tiene acceso admin.
- Los datos del solicitante se escapan antes de interpolarse en el HTML del mail (hoy se interpolan crudos; con más campos de texto libre —dirección, nombre— la inyección de markup en el cliente de correo deja de ser teórica).

**No hay cambios de base de datos**: ningún campo nuevo en Prisma, ninguna tabla, ninguna migración de Supabase, ninguna política RLS nueva. Toda la información ya está persistida en `Solicitud` y en `Solicitud.datos` (Json).

### Fuera de alcance (no cambia)

- El mail de confirmación al solicitante.
- El flujo de aprobar/rechazar (`src/app/admin/solicitudes/actions.ts`, `gestionarSolicitud`) y sus mails.
- El panel `/admin/solicitudes` y su control de acceso.
- No se agrega un segundo mail a la dueña del producto: el aviso hacia ella es exclusivamente el mensaje de WhatsApp que administración dispara desde el botón.
- No se integra WhatsApp Business API ni envío automático de mensajes: es un link `wa.me`, cero dependencias nuevas.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `email-transaccional`: se agrega el contrato del aviso institucional de nueva solicitud — qué datos debe llevar, cómo se sirven los enlaces a documentos de un bucket privado, y el canal de aviso por WhatsApp. Hoy la capability describe los mails al solicitante y al profesional, pero no dice nada del aviso a administración más allá de qué variables de entorno lo direccionan.

## Impact

**Código afectado:**

- `src/app/registro/actions.ts` — `crearSolicitud`: resolver localidad para el mail, firmar los documentos y armar el mail institucional con el nuevo contenido.
- `src/lib/storage/solicitudes.ts` — `firmarUrlsDocumentos` pasa a aceptar una vigencia explícita (hoy fija en 1 hora, insuficiente para un enlace que viaja por mail).
- Nuevo helper puro para el link `wa.me` (número de destino + armado del mensaje pre-cargado).
- Nuevo módulo puro que construye el HTML del mail institucional, testeable con Vitest sin tocar Resend ni Storage.
- Tests: `src/app/registro/actions.test.ts`, `src/lib/storage/solicitudes.test.ts` y tests nuevos para los helpers.

**Sin impacto:** Prisma schema, migraciones Supabase, RLS, dependencias de `package.json`, variables de entorno existentes.

**Riesgo de privacidad a decidir con la dueña del producto:** los enlaces firmados son portadores —cualquiera que reciba o reenvíe el mail puede abrir el DNI, el título y el CV del solicitante mientras la firma esté vigente. La vigencia elegida se justifica en `design.md`.
