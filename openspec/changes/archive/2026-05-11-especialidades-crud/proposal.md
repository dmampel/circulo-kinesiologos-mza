## Why

Las especialidades de los profesionales están hardcodeadas en el formulario de registro (`/registro`) con solo 3 opciones y valores de string arbitrarios. Esto impide escalar el listado, genera inconsistencias con la tabla `Especialidad` en BD, y el modelo ya existe pero no se gestiona desde ningún panel.

## What Changes

- Nuevo panel de gestión de especialidades en `/admin/profesionales` — sidebar deslizante igual al de categorías KineClub, con crear/editar/eliminar.
- Nuevo `especialidad-actions.ts` con Server Actions para CRUD de especialidades.
- Fix del formulario de registro: el `<select>` de especialidad pasa a cargar desde `EspecialidadRepository.getAll()` en vez de estar hardcodeado.
- El `EspecialidadRepository` recibe métodos adicionales: `create`, `update`, `delete`.

## Capabilities

### New Capabilities

- `especialidades-management`: CRUD de especialidades desde el panel admin de profesionales, con sidebar deslizante (mismo patrón que `CategoriaSidebar` en beneficios).

### Modified Capabilities

- `profesional-data-access`: El formulario de registro ahora carga las especialidades dinámicamente desde la BD en vez de usar valores hardcodeados.

## Impact

- **Archivos nuevos**: `src/app/admin/profesionales/EspecialidadSidebar.tsx`, `src/app/admin/profesionales/especialidad-actions.ts`
- **Archivos modificados**: `src/lib/repositories/EspecialidadRepository.ts`, `src/app/admin/profesionales/page.tsx`, `src/app/registro/page.tsx`, `src/app/registro/actions.ts`
- **Base de datos**: No requiere migración — la tabla `Especialidad` ya existe en schema.prisma.
- **Sin breaking changes** — el campo `nombre` (String `@unique`) sigue siendo el identificador de negocio.
