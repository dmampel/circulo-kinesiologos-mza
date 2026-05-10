# Tasks: Módulo de Capacitaciones

## Review Workload Forecast
| Field | Value |
|-------|-------|
| Estimated changed lines | ~600 |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** |
| Delivery strategy | `auto-chain` (Split in 2 PRs) |

---

## PR 1: Core Data & Admin Panel

- [x] 1.1 **Prisma Schema**:
  - Agregar models `Capacitacion` e `InscripcionCapacitacion`.
  - Agregar enums `TipoCapacitacion`, `ModalidadCapacitacion`, `EstadoInscripcion`.
  - Correr `npx prisma db push` y generar tipados.
- [x] 1.2 **Repositorio**:
  - Crear `src/lib/repositories/CapacitacionRepository.ts`.
  - Implementar CRUD base (`findAll`, `findById`, `create`, `update`, `delete`).
  - Implementar lógica de `inscribir(profesionalId, capacitacionId)`.
- [x] 1.3 **Admin - ABM**:
  - Crear actions en `src/app/admin/capacitaciones/actions.ts`.
  - Crear `/admin/capacitaciones/page.tsx` (Lista).
  - Crear `/admin/capacitaciones/nuevo/page.tsx` (Formulario).
- [x] 1.4 **Admin - Inscriptos**:
  - Crear `/admin/capacitaciones/[id]/page.tsx` (Detalles + Tabla Inscriptos).
  - Crear server action para cambiar estado de una inscripción (Pendiente -> Confirmada).

## PR 2: Socio Portal UX

- [x] 2.1 **Sidebar Socio**:
  - Agregar link "Capacitaciones" al sidebar (`src/components/socio/Sidebar.tsx`).
- [x] 2.2 **Panel Socio - Cartelera**:
  - Crear `/mi-panel/capacitaciones/page.tsx`.
  - UI: Listado de capacitaciones activas (Cards) y "Mis Inscripciones".
- [x] 2.3 **Panel Socio - Integración**:
  - Crear actions en `src/app/mi-panel/capacitaciones/actions.ts` (para invocar la inscripción/cancelación).
  - Componente de `BotonInscripcion` (Client Component).
- [x] 2.4 **Panel Socio - Modal de Pagos & Estados**:
  - Si el curso tiene costo, al inscribirse dejar en "Pendiente" y abrir Modal con CBU/Alias.
  - El Modal debe incluir botones de WhatsApp/Email prearmados.
  - Mostrar estado "Pendiente de Pago" (naranja) si no fue confirmado por admin.
  - Mostrar estado "Ya estás inscripto" (verde) solo si es gratis o si admin confirmó el pago.
