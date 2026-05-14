# Design: Admin Authorities CRUD

## Technical Approach
Implement a new administrative module to manage the `Autoridad` table. This involves a list view, a selection interface for professionals, and Server Actions for data persistence.

## Architecture Decisions

### Decision: Selection of Professionals
**Choice**: Searchable list in a separate "New" page or modal.
**Alternatives considered**: Dropdown/Select with all professionals.
**Rationale**: With 500+ professionals, a simple `<select>` would be slow and hard to use. A searchable list with debouncing is more scalable.

### Decision: Revalidation
**Choice**: Call `revalidatePath("/institucional")` in every action.
**Alternatives considered**: ISR with a timer.
**Rationale**: Authorities change rarely, so on-demand revalidation ensures the public site is always up-to-date without redundant fetches.

## Data Flow
The admin interacts with Server Components and Server Actions.

    Admin UI ──(Action)──→ AutoridadRepository ──→ Prisma/DB
       │                                            │
       └────(Revalidate)────→ Institutional Page ────┘

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/admin/layout.tsx` | Modify | Add "Autoridades" to sidebar. |
| `src/app/admin/autoridades/page.tsx` | Create | List of current authorities. |
| `src/app/admin/autoridades/nueva/page.tsx` | Create | Search interface to pick a professional. |
| `src/app/admin/autoridades/actions.ts` | Create | CRUD Server Actions (create, update, delete). |
| `src/lib/repositories/AutoridadRepository.ts` | Modify | Add `create`, `update`, `delete`, and `getById` methods. |

## Interfaces / Contracts

### AutoridadRepository extensions
```typescript
static async create(data: { cargo: string; orden: number; profesionalId: string });
static async update(id: string, data: Partial<{ cargo: string; orden: number; profesionalId: string }>);
static async delete(id: string);
```

## Testing Strategy
| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | CRUD Flow | Create an authority, verify it appears in admin list and institucional page. |
| Manual | Ordering | Change order and verify visual sequence. |
| Manual | Search | Verify professional search returns expected results. |

## Migration / Rollout
No migration required. The `Autoridad` table is already initialized with seed data.
