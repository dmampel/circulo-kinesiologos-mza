## Context

Vitest 4.x con jsdom ya está configurado (`vitest.config.ts`). `@testing-library/react` y `@testing-library/dom` instalados. No hay setup file todavía (`setupFiles: []`). El único test existente es un placeholder que se elimina.

Stack de testing target:
- `vitest` — runner + assertions
- `@testing-library/react` — render de componentes
- `vi.mock` — mocking de módulos (Prisma, Supabase, Next.js)
- `@testing-library/jest-dom` — matchers DOM (`.toBeInTheDocument()`, etc.)

## Goals / Non-Goals

**Goals:**
- Setup file funcional con `@testing-library/jest-dom`
- Tests de `detectarSolapamiento` con todos los casos borde relevantes
- Tests unitarios de `TurnoRepository` y `ProfesionalRepository` con Prisma mockeado
- Tests de `crearTurno` y `gestionarSolicitud` con dependencias externas mockeadas

**Non-Goals:**
- Tests de integración contra la DB real
- Tests E2E (Playwright/Cypress)
- Cobertura del 100% — solo las piezas críticas
- Tests de todos los repositorios (solo los más usados)

## Decisions

### D1: Co-ubicación de tests vs carpeta `__tests__`

**Decisión**: Tests co-ubicados junto al archivo que testean (`TurnoRepository.test.ts` al lado de `TurnoRepository.ts`).

**Rationale**: Más fácil de encontrar y mantener. El placeholder existente sigue este patrón.

---

### D2: Mock de Prisma — `vi.mock` manual vs `prisma-mock`

**Decisión**: `vi.mock('@/lib/prisma')` manual con `vi.fn()` por método usado en cada test.

**Alternativa descartada**: `prisma-mock` o `@quramy/jest-prisma` — agrega dependencia y complejidad para el scope actual.

**Rationale**: Los repositorios llaman métodos específicos de Prisma (`.findMany`, `.create`, `.update`). Mockear solo lo que se usa es más simple y explícito.

---

### D3: Tests de Server Actions — scope limitado

**Decisión**: Testear solo el flujo happy path y el caso de error más probable. No cubrir todos los branches.

**Rationale**: Las Server Actions tienen muchas dependencias externas (Supabase Auth, Storage, revalidatePath, redirect). El setup de mocks es costoso. El ROI está en los casos más probables de regresión.

**Mocks necesarios para actions**:
```ts
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/prisma')
vi.mock('@/lib/supabase/admin')
vi.mock('@/lib/resend')
```

---

### D4: Setup file — `@testing-library/jest-dom`

**Decisión**: Crear `src/test/setup.ts` con `import '@testing-library/jest-dom'` y agregarlo a `setupFiles` en `vitest.config.ts`.

**Rationale**: Sin esto, los matchers de DOM no están disponibles y los tests de componentes no compilan.

## Risks / Trade-offs

- **[Riesgo] Server Actions usan `"use server"`** — Vitest las importa como módulos normales (no hay runtime de Next.js). Mitigación: mockear todas las dependencias de Next.js. Si alguna acción usa APIs no mockeables, extraer la lógica pura a una función helper y testear esa.

- **[Riesgo] `detectarSolapamiento` llama a `prisma.turno.findMany`** — no es lógica pura. Mitigación: mockear el resultado de `findMany` para simular los turnos existentes; la lógica de overlap sí es pura y testeable.

- **[Trade-off] No hay tests de componentes en este change** — `@testing-library/react` queda configurado pero sin tests reales de UI. Es intencional: los componentes cambian más seguido que la lógica de negocio.

## Migration Plan

1. Crear `src/test/setup.ts`
2. Actualizar `vitest.config.ts` con `setupFiles`
3. Eliminar `src/utils/math.test.ts`
4. Crear tests de `TurnoRepository` (solapamiento + métodos)
5. Crear tests de `ProfesionalRepository`
6. Crear tests de `crearTurno` action
7. Crear tests de `gestionarSolicitud` action
8. Correr `npm test` y verificar que todo pasa
