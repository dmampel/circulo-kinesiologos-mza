# Design: fix-solicitud-duplicate-error

## Technical Approach

Implementaremos una validación preventiva en la Server Action `gestionarSolicitud` utilizando el patrón Repository. Extendemos el `ProfesionalRepository` para soportar búsquedas por campos únicos (`email`, `matricula`) y así evitar el error `P2002` de Prisma antes de interactuar con Supabase Auth.

## Architecture Decisions

### Decision: Extensión de ProfesionalRepository

**Choice**: Agregar métodos `findByEmail(email: string)` y `findByMatricula(matricula: string)`.
**Alternatives considered**: Hacer consultas directas con `prisma.profesional.findUnique` en la Server Action.
**Rationale**: Mantener el desacoplamiento dictado en `AGENTS.md` (Repository Pattern). El repositorio centraliza la lógica de acceso a datos y permite reutilizar estas validaciones en otros flujos (ej: edición manual).

### Decision: Validación Preemptiva (Early Exit)

**Choice**: Validar duplicados al inicio de `gestionarSolicitud`.
**Alternatives considered**: Validar después de la invitación de Supabase pero antes del insert de Prisma.
**Rationale**: Si el profesional ya existe en la DB, no tiene sentido enviarle una invitación de Supabase (que además podría fallar si el email ya está en Auth). La validación temprana es más limpia y segura.

## Data Flow

```
Admin (UI) ──> gestionarSolicitud(id, APROBAR)
                     │
                     ├──> ProfesionalRepository.exists(email, matricula)
                     │          │
                     │          └── [Si existe] ──> Retornar { success: false, error: "Ya existe..." }
                     │
                     ├──> SupabaseAdmin.auth.inviteUserByEmail()
                     │
                     ├──> prisma.profesional.create()
                     │
                     └──> prisma.solicitud.update(status: APROBADA)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/repositories/ProfesionalRepository.ts` | Modify | Agregar métodos `findByEmail` y `findByMatricula`. |
| `src/app/admin/solicitudes/actions.ts` | Modify | Implementar lógica de validación previa y manejo de errores con el esquema `{ success, error }`. |

## Interfaces / Contracts

```typescript
// En ProfesionalRepository.ts
static async findByEmail(email: string): Promise<Profesional | null>;
static async findByMatricula(matricula: string): Promise<Profesional | null>;

// En actions.ts (gestionarSolicitud)
// Devolverá un objeto compatible con la UI
export type ActionResponse = {
  success: boolean;
  error?: string;
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Duplicidad de Email | Intentar aprobar una solicitud con un email que ya figura en un profesional activo. |
| Manual | Duplicidad de Matrícula | Intentar aprobar una solicitud con una matrícula duplicada. |
| Manual | Flujo Exitoso | Verificar que una solicitud válida crea el profesional y el usuario en Auth correctamente. |

## Migration / Rollout

No requiere migración de datos. Es un cambio puramente de lógica de negocio.

## Open Questions

- ¿Debemos normalizar el email a minúsculas antes de la búsqueda? Sí, se hará en el repositorio para asegurar consistencia.
