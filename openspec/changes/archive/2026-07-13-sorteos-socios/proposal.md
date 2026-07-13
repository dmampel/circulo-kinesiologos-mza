## Why

El Círculo necesita una herramienta para organizar sorteos exclusivos para socios activos, incentivando la participación y el vínculo con la institución. Hoy no existe ningún mecanismo para gestionar esto desde la plataforma.

## What Changes

- Nuevo módulo de gestión de sorteos en el panel admin (crear, editar, publicar, realizar el sorteo).
- Nueva sección en el panel de socio para ver sorteos activos e inscribirse.
- Nuevos modelos en la base de datos: `Sorteo` e `InscripcionSorteo`.
- Row-Level Security habilitado en las nuevas tablas.

## Capabilities

### New Capabilities

- `sorteos-management`: CRUD de sorteos desde el admin — crear, editar, publicar, despublicar y ejecutar el sorteo (seleccionar ganador aleatorio).
- `socio-sorteos`: Vista en el panel de socio para ver sorteos activos e inscribirse/desinscribirse.

### Modified Capabilities

*(ninguna — los sorteos son una capacidad completamente nueva)*

## Impact

- **Schema**: Dos nuevos modelos (`Sorteo`, `InscripcionSorteo`) y un enum (`EstadoSorteo`). Requiere `prisma db push` y `ALTER TABLE` para RLS en Supabase.
- **Repositorios**: `SorteoRepository` (admin) e `InscripcionSorteoRepository` (socio).
- **Rutas nuevas**: `src/app/admin/sorteos/` y `src/app/mi-panel/sorteos/`.
- **Sin cambios breaking** en funcionalidad existente.
