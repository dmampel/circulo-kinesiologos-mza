## Context

The professionals page is the most complex data-fetching section of the app. It currently mixes UI and DB logic, making it fragile. We have already established the `prisma-repository-pattern` skill, and this is the first real application of it.

## Goals / Non-Goals

**Goals:**
- Centralize all `Profesional` queries in `ProfesionalRepository`.
- Create helper repositories for `Localidad` and `Especialidad`.
- Simplify `src/app/profesionales/page.tsx` by removing Prisma dependencies.
- Remove `as any` and replace with proper Prisma/TypeScript types.

**Non-Goals:**
- Changing the UI/Layout (only internal logic refactoring).
- Adding new search features (only existing ones).

## Decisions

- **Static Methods**: Repositories will use static methods for simplicity in the current Next.js environment.
- **Unified Filter Object**: Create a `ProfesionalFilters` interface to represent the `searchParams`.
- **Parallel Fetching**: Maintain the `Promise.all` pattern but move it into a higher-level function if possible, or keep it in the page but calling repositories.
- **Strict Typing**: The repository will return types defined by Prisma, ensuring the view knows exactly what it's getting.

## Risks / Trade-offs

- **Filter Mapping**: We must ensure that the `whereClause` logic in the repository exactly matches the current implementation to avoid regression in search results.
- **Boilerplate**: Adding repositories adds more files, but the long-term benefit for testing and maintenance outweighs this.
