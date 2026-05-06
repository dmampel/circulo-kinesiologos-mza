## 1. Repositories

- [x] 1.1 Create `src/lib/repositories/LocalidadRepository.ts` with `getAll` method.
- [x] 1.2 Create `src/lib/repositories/EspecialidadRepository.ts` with `getAll` method (excluding 'UBICACIÓN').
- [x] 1.3 Create `src/lib/repositories/ProfesionalRepository.ts` with `findPaginated` method incorporating search and filter logic.

## 2. Refactoring

- [x] 2.1 Update `src/app/profesionales/page.tsx` to use the new repositories.
- [x] 2.2 Remove direct Prisma imports and `as any` casts from the page.

## 3. Verification

- [x] 3.1 Verify that the professionals list, search, and filters (Localidad, Especialidad, Alphabet) work correctly in the browser.
- [x] 3.2 Run existing tests to ensure no regressions.
