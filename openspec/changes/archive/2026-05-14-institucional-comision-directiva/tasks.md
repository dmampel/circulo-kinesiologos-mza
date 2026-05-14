# Tasks: Gestión Dinámica de Comisión Directiva

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150-200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Foundation / Database
## Phase 1: Database Foundation

- [x] 1.1 Add `Autoridad` model to `prisma/schema.prisma` with relation to `Profesional`.
- [x] 1.2 Run `npx prisma db push` to update database schema.
- [x] 1.3 Add seed data for `Autoridad` in `prisma/seed.ts` using current hardcoded names.
- [x] 1.4 Run `npx prisma db seed` to populate the table.

## Phase 2: Data Access Layer

- [x] 2.1 Create `src/lib/repositories/AutoridadRepository.ts`.
- [x] 2.2 Implement `findAll()` method with `include: { profesional: true }` and `orderBy: { orden: 'asc' }`.

## Phase 3: Frontend Refactoring

- [x] 3.1 Refactor `src/app/institucional/page.tsx` to be a Server Component.
- [x] 3.2 Fetch data using `AutoridadRepository.findAll()`.
- [x] 3.3 Replace hardcoded constants `PRESIDENTE` and `COMISION_DIRECTIVA` with fetched data.
- [x] 3.4 Map database data to existing UI components (handling initials and names).

## Phase 4: Verification

- [x] 4.1 Verify that the page loads without errors.
- [x] 4.2 Verify that board members are displayed in the correct order.
- [x] 4.3 Verify that professional data (like photo) is correctly pulled from the relation.
