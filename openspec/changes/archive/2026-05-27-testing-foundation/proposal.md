## Why

Vitest está configurado y `@testing-library/react` instalado, pero el único test real es un placeholder (`math.test.ts`). Antes de ir a producción, las piezas de lógica más críticas del sistema deben tener cobertura: solapamiento de turnos, acciones de gestión de solicitudes y creación de turnos. Sin tests, un refactor o un bug en estas áreas pasa desapercibido.

## What Changes

- **Tests de lógica de solapamiento**: `TurnoRepository.detectarSolapamiento` — la función más crítica del turnero, con casos borde (solapamiento parcial, exacto, sin solapamiento, turno cancelado ignorado).
- **Tests de repositorios**: `TurnoRepository` y `ProfesionalRepository` — los dos repositorios más usados — con mocking de Prisma via `vi.mock`.
- **Tests de Server Actions críticas**: `crearTurno` (turnos) y `gestionarSolicitud` (solicitudes) — mockear `prisma`, `supabaseAdmin`, `revalidatePath` y `redirect`.
- **Setup de React Testing Library**: archivo `src/test/setup.ts` con `@testing-library/jest-dom` para matchers de DOM.
- **Eliminar el placeholder**: borrar `src/utils/math.test.ts`.

## Capabilities

### New Capabilities

- `testing-infrastructure`: Infraestructura de tests real — setup file, mocks de Prisma/Supabase, tests unitarios de repositorios y actions críticas.

### Modified Capabilities

*(ninguna)*

## Impact

- Nuevos archivos de test bajo `src/` (coubicados con el código que testean)
- `vitest.config.ts` — agregar `setupFiles` apuntando al setup file
- Sin cambios de schema ni de código de producción
- Dependencia nueva opcional: `@testing-library/user-event` (si se agregan tests de componentes)
