# Tasks: Circulares Leídas

## Review Workload Forecast

Estimated changed lines: ~150 lines
400-line budget risk: Low
Chained PRs recommended: No
Decision needed before apply: No

## Phase 1: Database Foundation
- [x] 1.1 Modificar `prisma/schema.prisma`: Agregar modelo `LecturaCircular` y relaciones en `Circular` y `Profesional`.
- [x] 1.2 Ejecutar `npx prisma db push` para actualizar la base de datos.
- [x] 1.3 Ejecutar `npx prisma generate` para actualizar el cliente de Prisma.

## Phase 2: Repository Layer
- [x] 2.1 Actualizar `src/lib/repositories/CircularRepository.ts`: Implementar `markAsRead(circularId, profesionalId)`.
- [x] 2.2 Actualizar `src/lib/repositories/CircularRepository.ts`: Implementar `countUnread(profesionalId)`.
- [x] 2.3 Actualizar `src/lib/repositories/CircularRepository.ts`: Implementar `getAllPublishedWithStatus(profesionalId)`.

## Phase 3: Server Actions & Logic
- [x] 3.1 Crear/Actualizar `src/app/mi-panel/circulares/actions.ts`: Implementar `registrarLecturaAction(circularId)`.
- [x] 3.2 Validar que el action use `revalidatePath('/mi-panel')`.

## Phase 4: Frontend Implementation
- [x] 4.1 Actualizar `src/app/mi-panel/layout.tsx`: Obtener `countUnread` y pasarlo al componente de navegación/sidebar.
- [x] 4.2 Actualizar `src/app/mi-panel/circulares/page.tsx`: Modificar el listado para mostrar el indicador de no leído (punto azul/negrita).
- [x] 4.3 Actualizar `src/app/mi-panel/circulares/[id]/page.tsx`: Invocar `registrarLecturaAction` (o repo) al cargar la página.

## Phase 5: Verification & Cleanup
- [x] 5.1 Verificar que al abrir una circular, el badge del sidebar disminuya.
- [x] 5.2 Verificar que el estado de lectura persista al recargar la página.
- [x] 5.3 Limpiar console logs y asegurar que las transiciones sean fluidas (Framer Motion si aplica).
- [x] 5.4 Fix: mover revalidatePath a ReadTracker (Client Component) — no puede ejecutarse durante render.
- [x] 5.5 Dashboard: usar getAllPublishedWithStatus para mostrar dot pulsante (no leída) vs gris estático (leída).
