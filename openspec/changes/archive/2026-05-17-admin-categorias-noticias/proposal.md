## Why

El módulo de noticias ya tiene categorías en la base de datos (`CategoriaNoticia`) pero no existe ninguna interfaz en el panel admin para gestionarlas. Los administradores no pueden crear, editar ni eliminar categorías de noticias sin acceso directo a la base de datos.

## What Changes

- Agregar `categoria-actions.ts` en `src/app/admin/noticias/` con Server Actions para crear, actualizar y eliminar categorías de noticias.
- Agregar `CategoriaSidebar.tsx` en `src/app/admin/noticias/` — panel deslizable con formulario dual (crear/editar) y listado de categorías existentes, idéntico en UX al de beneficios.
- Extender `CategoriaNoticiaRepository` con métodos `create`, `update` y `delete`.
- Integrar el botón "Gestionar Categorías" en `src/app/admin/noticias/page.tsx`.

## Capabilities

### New Capabilities
- `admin-categorias-noticias`: CRUD de categorías de noticias desde el panel admin mediante un sidebar deslizable con icono y color configurable.

### Modified Capabilities
- `noticias`: Se extiende el repositorio con métodos de escritura (create, update, delete) para categorías.

## Impact

- **Archivos nuevos**: `src/app/admin/noticias/categoria-actions.ts`, `src/app/admin/noticias/CategoriaSidebar.tsx`
- **Archivos modificados**: `src/lib/repositories/CategoriaNoticiaRepository.ts`, `src/app/admin/noticias/page.tsx`
- **Sin cambios de schema**: El modelo `CategoriaNoticia` ya existe en `prisma/schema.prisma`.
- **Sin migraciones Supabase**: No se agregan tablas nuevas.
