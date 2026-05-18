## Why

Al clickear un turno en la agenda semanal, el kinesiólogo es redirigido a una página de edición completa, rompiendo el flujo de trabajo. Se necesita un panel de detalle inline que permita ver toda la info del turno, cambiar su estado, editarlo y contactar al paciente sin salir de la agenda.

## What Changes

- Los cards de turno en `AgendaSemanal` pasan de ser `<Link>` a botones que abren un modal de detalle.
- Nuevo componente `TurnoDetailModal` que muestra:
  - Datos completos del turno (fecha, hora, duración, motivo, notas, estado).
  - Datos del paciente (nombre, teléfono, email).
  - Botones de cambio de estado (Confirmar, Completar, Cancelar, Pendiente).
  - Acceso rápido a contacto vía WhatsApp (link `wa.me`) y email (link `mailto:`).
  - Botón "Editar" que navega a `/mi-panel/turnos/[id]/editar`.
- El server action `cambiarEstadoTurno` ya existe y se reutiliza.
- No se requieren cambios de esquema ni migraciones Supabase.

## Capabilities

### New Capabilities
- `turno-detail-modal`: Panel modal de detalle de turno desde la agenda semanal — visualización completa, gestión de estados y contacto al paciente.

### Modified Capabilities
- `turnero-profesional`: La interacción de click en la agenda cambia de navegación directa a apertura de modal (cambio de comportamiento de UI, no de requisitos de datos).

## Impact

- `src/app/mi-panel/turnos/AgendaSemanal.tsx` — cards pasan de `<Link>` a `<button>` con handler de modal.
- `src/app/mi-panel/turnos/_components/TurnoDetailModal.tsx` — nuevo componente client (Sheet o Dialog de shadcn o custom Tailwind).
- `src/app/mi-panel/turnos/actions.ts` — se reutiliza `cambiarEstadoTurno`, sin cambios.
- Sin cambios en Prisma schema ni migraciones Supabase.
