## ADDED Requirements

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
