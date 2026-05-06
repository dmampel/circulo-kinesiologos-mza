## ADDED Requirements

### Requirement: Vitest Execution
The system MUST allow running unit tests using Vitest from the command line.

#### Scenario: Running all tests
- **WHEN** the developer runs `npm run test`
- **THEN** Vitest SHOULD execute all files matching `**/*.test.{ts,tsx}` and report the results.

### Requirement: React Component Testing
The system MUST support testing React components using `@testing-library/react`.

#### Scenario: Rendering a component in a test
- **WHEN** a test uses `render()` from `@testing-library/react`
- **THEN** the component SHOULD be rendered in a JSDOM environment for assertion.

### Requirement: Watch Mode
The system MUST support a watch mode for fast feedback during development.

#### Scenario: Running tests in watch mode
- **WHEN** the developer runs `npm run test:watch`
- **THEN** Vitest SHOULD start in watch mode and re-run tests on file changes.
