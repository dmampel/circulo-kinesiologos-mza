# Delta for socio-onboarding

## MODIFIED Requirements

### Requirement: Consistencia de Identidad

The system MUST ensure that the professional's database record is securely linked to their newly created authentication identity, and MUST validate that no existing records conflict with the new professional's unique fields (email, matricula) before proceeding with identity creation.
(Previously: The system MUST ensure that the professional's database record is securely linked to their newly created authentication identity.)

#### Scenario: Vinculación de identidad exitosa
- GIVEN the Supabase Auth user was successfully created and the `userId` was retrieved
- WHEN the system creates the `Profesional` record in the Prisma database
- THEN the system MUST store the Auth UUID in the `Profesional.userId` field
- AND the `Profesional.role` MUST be `PROFESIONAL`
- AND the `Profesional.status` MUST be `ACTIVO`.

#### Scenario: Fallo en creación de identidad (Fallback)
- GIVEN an administrator triggers the "Aprobar" action
- AND the system attempts to invite the user via Supabase Auth
- WHEN the Supabase Auth API returns an error (e.g., email already in use or network failure)
- THEN the system MUST NOT proceed to create the `Profesional` record in Prisma
- AND the system MUST abort the transaction and return the error message to the administrator UI.

#### Scenario: Validación de duplicados previa (Nuevo)
- GIVEN an administrator triggers the "Aprobar" action
- WHEN the system finds an existing `Profesional` with the same `email` or `matricula`
- THEN the system MUST NOT proceed with Supabase Auth invitation
- AND the system MUST return a descriptive error message indicating which field is duplicated.
