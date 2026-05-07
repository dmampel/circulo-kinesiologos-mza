# profesional-data-access Specification

## Purpose
TBD - created by archiving change refactor-profesionales-repository. Update Purpose after archive.
## Requirements
### Requirement: Centralized Data Access
All data fetching for professionals MUST be handled by the `ProfesionalRepository`.

#### Scenario: Fetching all active professionals
- **WHEN** the system requests all active professionals
- **THEN** the `ProfesionalRepository` SHOULD return a list of professionals filtered by `status: 'ACTIVO'`.

### Requirement: Filtered Searching
The system MUST support filtering by name, locality, specialty, and first letter of the last name.

#### Scenario: Searching by name and locality
- **WHEN** the user provides a search query and a locality ID
- **THEN** the repository SHOULD return only active professionals matching both criteria.

### Requirement: Paginated Results
The system MUST support pagination to optimize performance.

#### Scenario: Requesting a specific page
- **WHEN** the system requests page 2 with a specific page size
- **THEN** the repository SHOULD return the correct slice of data and the total count for pagination calculations.

### Requirement: Unique Field Lookup
The `ProfesionalRepository` MUST support looking up professionals by unique fields (email, matricula) to prevent duplicates.

#### Scenario: Lookup by email
- **GIVEN** the system needs to verify an email
- **WHEN** the `ProfesionalRepository` is queried by email (case-insensitive)
- **THEN** it MUST return the matching professional or null if not found.

#### Scenario: Lookup by matricula
- **GIVEN** the system needs to verify a matricula
- **WHEN** the `ProfesionalRepository` is queried by matricula
- **THEN** it MUST return the matching professional or null if not found.

