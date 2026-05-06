## Why

The current implementation of the `ProfesionalesPage` couples Prisma data fetching logic directly with the UI. This makes the code harder to test, maintain, and reuse. By introducing the Repository Pattern, we can centralize data access logic, improve type safety, and prepare the codebase for future scaling.

## What Changes

1.  **Introduce `ProfesionalRepository`**: A new class in `src/lib/repositories/` to handle all queries related to professionals.
2.  **Introduce `LocalidadRepository` & `EspecialidadRepository`**: To handle related filter data.
3.  **Refactor `src/app/profesionales/page.tsx`**: Replace direct Prisma calls with repository methods.
4.  **Remove `as any` types**: Implement proper TypeScript interfaces for search parameters and query results.

## Capabilities

### New Capabilities
- `profesional-data-access`: Centralized repository for professional-related data operations.

### Modified Capabilities
- None.

## Impact

- **Architecture**: Move from coupled data access to a decoupled Repository Pattern.
- **Code Quality**: Improved testability and removal of unsafe type casts.
- **Maintainability**: Easier to update query logic in one place.
