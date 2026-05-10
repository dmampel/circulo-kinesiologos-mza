## Why

El portal del socio muestra las capacitaciones disponibles en una lista pero no tiene una página de detalle. El socio no puede ver la descripción completa, la hora del evento, ni toda la información relevante sin salir del portal.

## What Changes

- Nueva ruta `/mi-panel/capacitaciones/[id]` con página de detalle completa para el socio.
- Los cards de la cartelera en `/mi-panel/capacitaciones` enlazan a esta página.
- Dos nuevos métodos en `CapacitacionRepository`: `findPublicadaById` y `getInscripcionSocio`.
- Las acciones de inscripción/cancelación revalidan también la ruta de detalle.

## Capabilities

### New Capabilities
- `detalle-capacitacion-socio`: Página de detalle de una capacitación para el socio autenticado. Muestra toda la información del evento (título, descripción completa, fecha y **hora**, ubicación, cupos, costo) y el estado de inscripción del socio con las acciones disponibles (inscribirse, ver datos de pago, cancelar).

### Modified Capabilities
- `capacitaciones-socio`: Los cards de la cartelera agregan un enlace a la página de detalle. Las Server Actions agregan revalidación de la ruta `/mi-panel/capacitaciones/[id]`.

## Impact

- **Nuevo archivo**: `src/app/mi-panel/capacitaciones/[id]/page.tsx`
- **Modificado**: `src/lib/repositories/CapacitacionRepository.ts` — dos nuevos métodos
- **Modificado**: `src/app/mi-panel/capacitaciones/actions.ts` — ampliar revalidatePath
- **Modificado**: `src/app/mi-panel/capacitaciones/page.tsx` — links a detalle
- Sin cambios en el schema de Prisma ni migraciones requeridas.
