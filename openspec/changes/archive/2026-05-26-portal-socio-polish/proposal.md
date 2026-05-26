## Why

El Mi Panel del socio tiene datos hardcodeados en la card de cabecera (vencimiento, estado), un bug de formato en los precios de capacitaciones, y carece de diferenciación visual entre días pasados y el día actual en la agenda. Además, los turnos pasados permanecen en estado PENDIENTE/CONFIRMADO indefinidamente, lo que ensucia la agenda.

## What Changes

- **Dashboard header card**: eliminar "Vencimiento: Dic 2026" hardcodeado; reemplazar badge "Activo" por `profesional.status` real
- **Agenda semanal**: días pasados visualmente apagados (opacity baja), día actual con estilo destacado existente
- **Precio capacitaciones**: corregir `toLocaleString()` → `toLocaleString("es-AR")` en `mi-panel/capacitaciones/page.tsx`
- **Turnos auto-completado**: al cargar los turnos, los que tengan fecha pasada y estado PENDIENTE o CONFIRMADO se actualizan automáticamente a COMPLETADO

## Capabilities

### New Capabilities

_(ninguna — no se introduce nueva funcionalidad, solo correcciones)_

### Modified Capabilities

- `socio-portal`: Agenda visual — días pasados apagados, comportamiento de auto-completado de turnos al cargar el dashboard
- `capacitaciones-socio`: Formato de precio con locale `es-AR` (punto como separador de miles)

## Impact

- `src/app/mi-panel/page.tsx` — dashboard: usar `profesional.status`, eliminar "Vencimiento", estilos de agenda
- `src/app/mi-panel/capacitaciones/page.tsx` — fix `toLocaleString("es-AR")`
- `src/lib/repositories/TurnoRepository.ts` — lógica de auto-completado de turnos pasados
- Admin: posiblemente exponer `fechaVencimiento` en el CRUD de profesionales (fuera de scope de este change, se puede agregar después)
