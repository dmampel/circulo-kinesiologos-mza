# Admin Auth Management Specification

## Purpose

Define los requerimientos para que el backend del sistema interactúe con el proveedor de autenticación con privilegios elevados, permitiendo la gestión administrativa de usuarios sin intervención del cliente.

## Requirements

### Requirement: Bypass de RLS mediante Service Role

The system MUST bypass Row Level Security policies when executing administrative authentication actions from backend Server Actions.

#### Scenario: Configuración del cliente admin

- GIVEN the Next.js server actions require user creation privileges
- WHEN the Supabase client is initialized for administrative duties
- THEN the client MUST be instantiated using the `SUPABASE_SERVICE_ROLE_KEY`
- AND the environment variable storing this key MUST NOT contain the `NEXT_PUBLIC_` prefix to prevent exposure to the browser.

### Requirement: Manejo Seguro de Sesiones Administrativas

The system MUST NOT inherit or persist sessions when acting on behalf of the system administrator.

#### Scenario: Inicialización pura

- GIVEN the system initializes the admin Supabase client
- WHEN the `@supabase/supabase-js` instance is created
- THEN it MUST be configured to not persist sessions (`persistSession: false`)
- AND it MUST NOT attempt to read user cookies for these specific backend actions.
