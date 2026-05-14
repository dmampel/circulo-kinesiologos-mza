# Tasks: Admin Authorities CRUD

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350-450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

## Phase 1: Data Access Layer

- [x] 1.1 Extend `AutoridadRepository.ts` with `create`, `update`, `delete`, and `getById` methods.

## Phase 2: Sidebar & List View

- [x] 2.1 Add "Autoridades" link to `SIDEBAR_LINKS` in `src/app/admin/layout.tsx`.
- [x] 2.2 Create `src/app/admin/autoridades/page.tsx` with a table listing current authorities.
- [x] 2.3 Add "Eliminar" button with confirmation in the list view.
- [x] 2.4 Add "Editar" button and create `src/app/admin/autoridades/editar/[id]/page.tsx`.

## Phase 3: Search & Selection UI

- [x] 3.1 Create `src/app/admin/autoridades/nueva/page.tsx` with a search bar for professionals.
- [x] 3.2 Implement results list with "Seleccionar" button for each professional.
- [x] 3.3 Create a small form component to assign role and order to the selected professional.

## Phase 4: Actions & Revalidation

- [x] 4.1 Create `src/app/admin/autoridades/actions.ts` with `crearAutoridad`, `actualizarAutoridad`, and `eliminarAutoridad`.
- [x] 4.2 Wire the list and creation forms to the Server Actions.
- [x] 4.3 Add `revalidatePath` to all actions for `/institucional` and `/admin/autoridades`.

## Phase 5: Verification

- [x] 5.1 Verify that adding a professional as authority works.
- [x] 5.2 Verify that changing the order reflects on the institutional page.
- [x] 5.3 Verify that deleting an authority works and doesn't delete the professional.
- [x] 5.4 Verify that editing an authority (including changing professional) works.
- [x] 5.5 Polished UI: custom select arrow and removed manual role entry.
