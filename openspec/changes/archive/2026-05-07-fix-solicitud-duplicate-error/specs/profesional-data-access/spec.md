# Delta for profesional-data-access

## ADDED Requirements

### Requirement: Unique Field Lookup
The `ProfesionalRepository` MUST support looking up professionals by unique fields (email, matricula) to prevent duplicates.

#### Scenario: Lookup by email
- GIVEN the system needs to verify an email
- WHEN the `ProfesionalRepository` is queried by email (case-insensitive)
- THEN it MUST return the matching professional or null if not found.

#### Scenario: Lookup by matricula
- GIVEN the system needs to verify a matricula
- WHEN the `ProfesionalRepository` is queried by matricula
- THEN it MUST return the matching professional or null if not found.
