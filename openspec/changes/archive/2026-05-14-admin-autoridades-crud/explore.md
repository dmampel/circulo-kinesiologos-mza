# Exploration: Admin Authorities CRUD

## Goal
Implement a management interface for the `Autoridad` model in the admin panel.

## Current State
- `Autoridad` model linked to `Profesional` via `profesionalId`.
- Institutional page already consumes data from `AutoridadRepository`.
- No admin UI exists yet.

## Findings
- Admin panel structure follows `src/app/admin/[feature]/page.tsx` with Server Actions in `actions.ts`.
- Components are shared in `src/app/admin/_components`.

## Approach
1. **List Page**: Show current authorities in a table/list ordered by `orden`.
2. **Creation/Selection**: A way to search for a professional (from the existing 500+ professionals) and assign them a role.
3. **Ordering**: Drag-and-drop or simple index editing to manage the `orden` field.
4. **Roles**: Standard list of roles (Presidente, Vicepresidente, etc.) plus custom input if needed.

## Risks
- Search performance: Searching 500+ professionals should be efficient (debounced client-side search or server-side pagination).
- Relation integrity: Ensuring only existing professionals can be assigned.

## Next Steps
- Propose the design and specifications.
