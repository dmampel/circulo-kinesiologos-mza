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

### Requirement: Actualización de Datos del Profesional por userId

El `ProfesionalRepository` DEBE exponer un método `update(userId, data)` que permita
modificar los campos de contacto y foto de un profesional identificado por su `userId` de Supabase Auth.

Los campos actualizables a través de este método DEBEN ser:
`telefono`, `whatsapp`, `direccion`, `horarios`, `foto_url`.

El método DEBE usar `userId` (no `id`) como clave de lookup para garantizar
que solo el usuario autenticado pueda modificar su propio registro.

#### Scenario: Actualización exitosa de datos de contacto

- GIVEN un `userId` válido correspondiente a un profesional activo
- WHEN se llama a `ProfesionalRepository.update(userId, { telefono: "2614000000" })`
- THEN el repositorio actualiza el campo en la base de datos y retorna el profesional actualizado

#### Scenario: Actualización de foto_url

- GIVEN una URL pública de Supabase Storage válida
- WHEN se llama a `ProfesionalRepository.update(userId, { foto_url: "https://..." })`
- THEN el campo `foto_url` del profesional queda actualizado en la base de datos

#### Scenario: userId inexistente

- GIVEN un `userId` que no corresponde a ningún profesional
- WHEN se llama a `ProfesionalRepository.update(userId, data)`
- THEN el repositorio lanza un error (Prisma P2025 — record not found)
