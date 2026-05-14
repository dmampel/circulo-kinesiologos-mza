# Proposal: Admin Authorities CRUD

## Intent
Enable administrators to manage the Comisión Directiva (Authorities) through a user-friendly interface, eliminating the need for manual database updates.

## Scope
- Create an "Autoridades" section in the admin sidebar/dashboard.
- Implement a list view of current authorities.
- Implement a search and select mechanism for professionals.
- Implement role assignment and ordering.
- Implement deletion of authorities.

## Success Criteria
- Administrators can add any professional as an authority.
- Administrators can change the order of authorities.
- Changes are immediately reflected on the institutional page.

## Technical Approach
- **UI**: New route `/admin/autoridades`.
- **Search**: Combobox or searchable list of professionals.
- **Actions**: Server Actions for `create`, `update` (order/role), and `delete`.
- **Persistence**: Prisma `Autoridad` model.
