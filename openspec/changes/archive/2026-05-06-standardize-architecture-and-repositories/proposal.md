## Why

The project has grown with several pages (Noticias, Obras Sociales, Kineclub) that follow different patterns or directly access the database via Prisma. This inconsistency makes the codebase harder to maintain and test. Additionally, components are currently scattered within route folders, violating the Atomic Design principle we want to establish.

## What Changes

1.  **Repository Standardization**:
    - Create `ObraSocialRepository`, `NoticiaRepository`, and `BeneficioRepository`.
    - Refactor `ObrasSocialesPage`, `NoticiasPage`, and `KineclubPage` to use these repositories.
    - Migrate hardcoded data in `NoticiasPage` to the Prisma database.
2.  **Atomic Design Migration**:
    - Move UI components from `src/app/profesionales/` to `src/components/atoms`, `molecules`, or `organisms`.
    - Update all imports affected by these moves.
3.  **Type Safety & Validation**:
    - Introduce **Zod** for search parameters validation.
    - Eliminate `as any` casts in data-fetching logic.

## Capabilities

### New Capabilities
- `global-repositories`: Unified data access layer for all main models.
- `atomic-component-library`: Structured component library following Atomic Design.

### Modified Capabilities
- `profesional-data-access`: Update to match the new standardized repository patterns if necessary.

## Impact

- **Architecture**: Enforces a clean separation between data access, business logic, and UI.
- **Maintainability**: Centralizes query logic and organizes components predictably.
- **Reliability**: Adds runtime validation for URL parameters.
