## 1. Repositories & Data

- [x] 1.1 Create `ObraSocialRepository`, `NoticiaRepository`, and `BeneficioRepository`.
- [ ] 1.2 Update `prisma/seed.ts` (or create a script) to populate the `Noticia` table with the previously hardcoded data.
- [ ] 1.3 Run `npx prisma db seed` to populate the DB.

## 2. Component Migration (Atomic Design)

- [x] 2.1 Move `AlphabetSidebar`, `FilterSelect`, `Pagination`, and `SearchInput` to `src/components/atoms` or `molecules`.
- [x] 2.2 Update all imports in `profesionales/page.tsx`, `noticias/page.tsx`, etc.

## 3. Validation & Refactoring

- [x] 3.1 Create Zod schemas for search parameters in `src/lib/validations/searchParams.ts`.
- [x] 3.2 Refactor `ObrasSocialesPage` to use repository and Zod.
- [x] 3.3 Refactor `NoticiasPage` to use repository and Zod.
- [x] 3.4 Refactor `KineClubPage` to use repository and Zod.

## 4. Verification

- [x] 4.1 Verify all pages load correctly with search/filters.
- [x] 4.2 Ensure no `as any` casts remain in the affected pages.
