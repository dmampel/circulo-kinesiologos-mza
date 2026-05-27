## Why

El flujo de registro de solicitudes no tiene emails transaccionales hacia el solicitante: no recibe confirmación al enviar su solicitud, ni notificación cuando es aprobada o rechazada. Resend ya está instalado y configurado; solo faltan los emails al solicitante y un cleanup del email institucional hardcodeado.

## What Changes

- **Email de confirmación al solicitante** tras registro exitoso (actualmente solo hay un redirect a `/registro/exito` sin email).
- **Email de aprobación al profesional** cuando su solicitud es aprobada (Supabase envía el invite link, pero sin contexto institucional).
- **Email de rechazo al profesional** cuando su solicitud es rechazada (actualmente no existe ninguna comunicación).
- **Email institucional → variable de entorno**: el email de destino `institucional@circulokinesiologos.com` y el sender `onboarding@resend.dev` están hardcodeados en `registro/actions.ts`; pasar a `RESEND_FROM_EMAIL` y `INSTITUTIONAL_EMAIL`.

## Capabilities

### New Capabilities

- `email-transaccional`: Emails automáticos del flujo de solicitud de asociación — confirmación al solicitante, aprobación y rechazo — usando Resend.

### Modified Capabilities

*(ninguna)*

## Impact

- `src/app/registro/actions.ts` — agregar email de confirmación al solicitante + leer env vars
- `src/app/admin/solicitudes/actions.ts` — agregar emails de aprobación y rechazo
- Variables de entorno nuevas: `RESEND_FROM_EMAIL`, `INSTITUTIONAL_EMAIL`
- Sin cambios de schema (sin migraciones Prisma)
