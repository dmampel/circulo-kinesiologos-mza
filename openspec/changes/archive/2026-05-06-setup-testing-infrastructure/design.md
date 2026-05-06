## Context

The project is a Next.js 16 application using Prisma and Supabase. Currently, there is no automated testing, which increases the risk of regressions as the codebase grows. We need a professional testing setup that integrates well with the existing stack.

## Goals / Non-Goals

**Goals:**
- Enable unit testing for utility functions and business logic.
- Enable component testing for React components.
- Provide a fast developer feedback loop with watch mode.
- Establish a pattern for writing tests in the project.

**Non-Goals:**
- End-to-end (E2E) testing with Playwright/Cypress (to be addressed in a future change).
- Full integration testing with a real Supabase database (unit/component focus for now).

## Decisions

- **Test Runner: Vitest**. Chosen for its speed and native ESM support, which fits well with modern Next.js.
- **Environment: JSDOM**. To simulate a browser environment for React component testing.
- **Library: React Testing Library**. The industry standard for testing React components from a user-centric perspective.
- **Plugin: @vitejs/plugin-react**. Required for Vitest to process JSX/TSX files.
- **Configuration: vitest.config.ts**. Root-level configuration for Vitest.

## Risks / Trade-offs

- **Next.js 16 Compatibility**: Since Next.js 16 is cutting-edge, some Server Component specific features might require manual mocking or `vi.mock` until better integration is available.
- **Tailwind 4 Integration**: CSS variables from Tailwind 4 might not be fully loaded in JSDOM tests without extra setup, but for functional tests (logic over style) this is acceptable.
