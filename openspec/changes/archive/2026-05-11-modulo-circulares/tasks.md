# Tasks: Módulo de Circulares Internas

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Foundation (Data Layer)

- [x] 1.1 Modificar `prisma/schema.prisma` agregando el modelo `Circular`.
- [x] 1.2 Ejecutar `npx prisma db push` y `npx prisma generate` para actualizar la base de datos de desarrollo y los tipos.
- [x] 1.3 Crear `src/lib/repositories/CircularRepository.ts` con los métodos CRUD (`getAll`, `getPublishedLatest`, `create`, `update`, `delete`, `getById`).

## Phase 2: Server Actions

- [x] 2.1 Crear `src/app/admin/circulares/actions.ts` exportando las server actions para manejar los formularios de creación, edición y eliminación de circulares.

## Phase 3: Admin UI (CRUD)

- [x] 3.1 Crear `src/app/admin/circulares/page.tsx` para listar todas las circulares de forma tabular con su estado, etiqueta y acciones.
- [x] 3.2 Crear `src/app/admin/circulares/nueva/page.tsx` con el formulario para crear una circular nueva.
- [x] 3.3 Crear `src/app/admin/circulares/editar/[id]/page.tsx` con el formulario para editar una circular existente, pre-cargando los datos del repositorio.

## Phase 4: Integración Socio Dashboard

- [x] 4.1 Modificar `src/app/mi-panel/page.tsx` para consumir `CircularRepository.getPublishedLatest(3)` y mapear los registros reales en lugar del array estático `[ { title: "..." } ]`.
- [x] 4.2 Formatear las fechas en `mi-panel/page.tsx` para que coincidan con la UI original usando `Intl.DateTimeFormat`.

## Phase 5: Verification (Manual)

- [x] 5.1 Verificar creación de una circular desde el panel Admin.
- [x] 5.2 Verificar publicación y visualización dinámica en Mi Panel del socio.
- [x] 5.3 Verificar filtrado (que borradores no aparezcan en Mi Panel).
