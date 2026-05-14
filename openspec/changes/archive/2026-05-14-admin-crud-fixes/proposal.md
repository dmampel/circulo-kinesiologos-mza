## Why

El panel de administración tiene funcionalidad CRUD incompleta: noticias no tiene edición ni eliminación funcional, y beneficios tiene eliminación sin acción wired. Estas rutas ya están linkeadas en la UI pero llevan a 404 o no hacen nada — es un bug bloqueante para operar el sitio.

## What Changes

- **Noticias — editar**: nueva ruta `/admin/noticias/editar/[id]` con formulario precargado + action `actualizarNoticia()`
- **Noticias — eliminar**: wiring del botón delete existente con `eliminarNoticia()` via form action
- **Beneficios — eliminar**: wiring del botón delete existente con `eliminarBeneficio()` via form action
- Sin cambios de schema (no requiere migraciones Prisma ni Supabase)

## Capabilities

### New Capabilities

- `admin-noticias-crud`: Edición y eliminación de noticias desde el panel de administración

### Modified Capabilities

- `noticias-frontend`: La gestión admin de noticias ahora incluye update y delete completos

## Impact

- `src/app/admin/noticias/actions.ts` — nueva action `actualizarNoticia()`
- `src/app/admin/noticias/editar/[id]/page.tsx` — nueva ruta de edición
- `src/app/admin/noticias/page.tsx` — delete button wrapeado en form con action
- `src/app/admin/beneficios/page.tsx` — delete button wrapeado en form con action
- `src/lib/repositories/NoticiaRepository.ts` — nuevo método `update()`
- Sin migraciones de DB
