## Why

El módulo de capacitaciones fue implementado con algunos gaps: los actions del admin no validan inputs con Zod (requerido por AGENTS.md), los datos bancarios están hardcodeados en el componente, no hay confirmación antes de cancelar una inscripción, y no existe UI para editar una capacitación ya creada aunque el repositorio lo soporta.

## What Changes

- **Validación Zod** en `createCapacitacion` (admin action): proteger contra inputs malformados (NaN en costo, fechas inválidas, enums fuera de rango).
- **Página de edición** `/admin/capacitaciones/[id]/editar`: formulario pre-poblado con los datos actuales, action `updateCapacitacion`, botón "Editar" en la lista de admin.
- **Datos bancarios a variables de entorno**: `CBU`, `Alias` y `Titular` salen del componente `BotonInscripcion` y van a `NEXT_PUBLIC_*` en `.env`.
- **Confirmación antes de "Bajarme"**: diálogo nativo o inline confirm en el botón de cancelar inscripción del socio.

## Capabilities

### New Capabilities
- `capacitacion-edit`: Formulario de edición de capacitación para el admin con validación y redirección post-update.

### Modified Capabilities
- `capacitaciones`: Se agregan validaciones Zod al flujo de creación, se externalizan datos bancarios, y se agrega confirmación de cancelación en el portal socio.

## Impact

- `src/app/admin/capacitaciones/actions.ts` — agregar Zod schema + `updateCapacitacion` action
- `src/app/admin/capacitaciones/[id]/editar/page.tsx` — nueva página
- `src/app/admin/capacitaciones/page.tsx` — agregar botón "Editar" en la tabla
- `src/components/socio/BotonInscripcion.tsx` — leer CBU/Alias de env vars
- `.env` / `.env.example` — agregar `NEXT_PUBLIC_CBU`, `NEXT_PUBLIC_ALIAS`, `NEXT_PUBLIC_TITULAR`
- No hay cambios de schema Prisma ni migraciones de Supabase.
