## ADDED Requirements

### Requirement: No console statements in Server Actions
Server Actions SHALL NOT contain `console.log`, `console.error`, or `console.warn` calls. Error information MUST be communicated exclusively via the return value `{ success: false, error: string }`.

#### Scenario: Server Action catches an exception
- **WHEN** a Server Action catches an unexpected error in a try/catch block
- **THEN** it SHALL return `{ success: false, error: "<user-friendly message>" }` without logging to console

#### Scenario: Non-critical secondary operation fails
- **WHEN** a secondary operation (e.g., deleting a previous file from Storage) fails inside a Server Action
- **THEN** the action SHALL silently continue without logging to console, as long as the primary operation succeeded

### Requirement: Typed inputs in Server Actions
Server Actions that receive structured data MUST NOT use `any` as the parameter type. They SHALL use a named interface or Prisma-generated types.

#### Scenario: Saving a profesional from admin
- **WHEN** `saveProfesional(data, especialidadIds)` is called
- **THEN** `data` SHALL be typed as `ProfesionalInput` (a named interface defined in the same file), not `any`

#### Scenario: Building dynamic Prisma where conditions
- **WHEN** `getProfesionales()` constructs a filter array
- **THEN** the array SHALL be typed as `Prisma.ProfesionalWhereInput[]`, not `any[]`
