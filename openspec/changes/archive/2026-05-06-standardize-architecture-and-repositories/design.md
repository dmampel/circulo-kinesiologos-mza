## Context

The project is currently in a state where features are being added quickly, leading to some "accidental architecture". We want to pivot to a "planned architecture" using the patterns established in our project skills.

## Goals / Non-Goals

**Goals:**
- Move all UI components to `src/components/`.
- Standardize all pages to use Repositories.
- Use Zod for type-safe searchParams.
- Migrate `noticias/page.tsx` from hardcoded to DB.

**Non-Goals:**
- Redesigning the CSS or HTML structure (purely architectural refactoring).
- Adding new features to the admin panel.

## Decisions

- **Zod Schemas**: Create a `src/lib/validations/` folder for search parameter schemas.
- **Repository Methods**:
    - `NoticiaRepository.getLatest()`
    - `ObraSocialRepository.getAllActive()`
    - `BeneficioRepository.getByCategory(category: string)`
- **Component Mapping**:
    - `AlphabetSidebar` -> `molecules`
    - `FilterSelect` -> `atoms`
    - `Pagination` -> `molecules`
    - `SearchInput` -> `atoms`

## Risks / Trade-offs

- **Import Hell**: Moving many components at once can break many files. We must be thorough with find/replace.
- **Data Migration**: Moving `NOTICIAS` to the DB requires a one-time seed or manual entry. We will create a `prisma/seed.ts` update for this.
