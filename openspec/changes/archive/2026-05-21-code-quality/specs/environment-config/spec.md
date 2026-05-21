## ADDED Requirements

### Requirement: Environment variables documented
The project SHALL provide a `.env.example` file at the root of `ckm-web/` listing all required environment variables with a description comment for each one.

#### Scenario: Developer sets up the project for the first time
- **WHEN** a developer clones the repository
- **THEN** they SHALL find a `.env.example` file that lists every variable needed to run the app locally

#### Scenario: Missing variable causes a clear failure
- **WHEN** a required variable is absent from `.env.local`
- **THEN** the corresponding Supabase client or Prisma call SHALL fail at runtime with a descriptive message (not a silent undefined)
