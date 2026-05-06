# Socio Onboarding Specification

## Purpose

Define el flujo automatizado para la creación de la identidad digital de un socio una vez que el Círculo aprueba su solicitud de admisión.

## Requirements

### Requirement: Invitación Automática de Autenticación

The system MUST invite the approved professional to the authentication platform upon request approval.

#### Scenario: Aprobación exitosa de solicitud

- GIVEN an administrator is reviewing a pending `Solicitud`
- WHEN the administrator triggers the "Aprobar" action
- THEN the system MUST trigger a secure email invitation via Supabase Auth to the professional's email address
- AND the system MUST capture the newly generated `userId` from Supabase.

### Requirement: Consistencia de Identidad

The system MUST ensure that the professional's database record is securely linked to their newly created authentication identity.

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
