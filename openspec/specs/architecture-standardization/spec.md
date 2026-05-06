# architecture-standardization Specification

## Purpose
TBD - created by archiving change standardize-architecture-and-repositories. Update Purpose after archive.
## Requirements
### Requirement: Repository Uniformity
All data models (ObraSocial, Noticia, BeneficioKineClub) MUST have a dedicated repository class in `src/lib/repositories/`.

#### Scenario: Fetching active benefits
- **WHEN** the Kineclub page requests benefits
- **THEN** it MUST call `BeneficioRepository.getAll()` and receive a typed list.

### Requirement: Atomic Component Structure
UI components MUST NOT reside within `src/app/` folders.

#### Scenario: Reusing Pagination component
- **WHEN** the system needs pagination in multiple pages
- **THEN** it MUST import it from `src/components/molecules/Pagination`.

### Requirement: URL Parameter Validation
All pages accepting search parameters MUST validate them using Zod.

#### Scenario: Handling invalid page number
- **WHEN** a user provides `?page=abc` in the URL
- **THEN** the Zod schema SHOULD fallback to a default value (e.g., page 1) instead of crashing the app.

