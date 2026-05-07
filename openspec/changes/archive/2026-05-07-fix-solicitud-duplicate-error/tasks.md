# Tasks: fix-solicitud-duplicate-error

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~50-80 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

## Phase 1: Foundation (Repository Extension)

- [x] 1.1 Add `findByEmail(email: string)` to `src/lib/repositories/ProfesionalRepository.ts`. Ensure case-insensitive search and email normalization.
- [x] 1.2 Add `findByMatricula(matricula: string)` to `src/lib/repositories/ProfesionalRepository.ts`.
- [x] 1.3 Verify methods by checking they correctly return null for non-existent records.

## Phase 2: Core Implementation (Server Action)

- [x] 2.1 Import `ProfesionalRepository` in `src/app/admin/solicitudes/actions.ts`.
- [x] 2.2 Add validation block at the start of `gestionarSolicitud` (APROBAR action).
- [x] 2.3 Check for existing professional by email (normalized).
- [x] 2.4 Check for existing professional by matricula.
- [x] 2.5 Throw descriptive errors: "Ya existe un profesional con este email" / "Ya existe un profesional con esta matrícula".
- [x] 2.6 Ensure `gestionarSolicitud` returns `{ success: false, error: "..." }` on validation failure.

## Phase 3: Verification (Manual Testing)

- [ ] 3.1 Scenario: Duplicate Email. Verify UI shows "Ya existe un profesional con este email".
- [ ] 3.2 Scenario: Duplicate Matricula. Verify UI shows error.
- [ ] 3.3 Scenario: Success Flow. Verify new approval still works and creates user + professional.
- [ ] 3.4 Scenario: Abort Fallback. Verify Supabase invite is NOT sent if validation fails.
