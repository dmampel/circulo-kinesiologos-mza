# Design: Portal del Socio — Perfil Editable

## Technical Approach

Dos Server Actions independientes (`updateDatosContacto` / `updateFotoPerfil`) en
`src/app/mi-panel/perfil/actions.ts`. La página es un **Server Component** que carga datos
actuales; el formulario es un **Client Component** con `useActionState` para feedback
optimista. El repository recibe un nuevo método estático `update(userId, data)`.

Patrón adoptado: idéntico al ya establecido en `src/app/auth/actions.ts` y
`src/app/admin/solicitudes/actions.ts` — sin API Routes, sin fetch del cliente.

## Architecture Decisions

### Decision: Upload de foto via Admin Client (Service Role)

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Admin Client (`supabaseAdmin`) para el upload | Bypass de RLS; la autorización es responsabilidad de la Server Action | ✅ Elegida |
| Signed Upload URL (cliente sube directamente) | Menor carga en el servidor; pero requiere más complejidad de flujo | ❌ Rechazada |
| Auth Client del usuario | Requiere configurar RLS en Storage específico por `userId`; más frágil | ❌ Rechazada |

**Rationale:** La Server Action valida que el `userId` del JWT coincida con el profesional antes de subir. El `supabaseAdmin` ya existe en el proyecto y se usa de esta forma.

### Decision: Dos Server Actions separadas

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Dos actions (datos + foto) | Cada form tiene un submit claro; la foto no bloquea los datos de texto | ✅ Elegida |
| Una sola action | Más simple pero mezcla lógica de Storage con lógica de DB | ❌ Rechazada |

### Decision: Nombre del archivo en Storage

`profesionales-fotos/{userId}/{timestamp}.{ext}` — evita colisiones y permite listar archivos por usuario sin metadata adicional.

## Data Flow

```
[PerfilForm — Client Component]
        │
        ├── submit datos texto
        │       └── updateDatosContacto(FormData)   [Server Action]
        │               ├── getUser()  ← validar sesión
        │               ├── ProfesionalRepository.update(userId, data)
        │               └── revalidatePath('/mi-panel', '/mi-panel/perfil')
        │
        └── submit foto
                └── updateFotoPerfil(FormData)       [Server Action]
                        ├── getUser()  ← validar sesión
                        ├── validar tamaño (≤ 2MB) y tipo
                        ├── supabaseAdmin.storage.upload(...)
                        ├── supabaseAdmin.storage.getPublicUrl(...)
                        ├── ProfesionalRepository.update(userId, { foto_url })
                        └── revalidatePath('/mi-panel', '/mi-panel/perfil')
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/repositories/ProfesionalRepository.ts` | Modify | Agregar `static async update(userId, data)` |
| `src/app/mi-panel/perfil/page.tsx` | Create | Server Component — carga profesional y renderiza `PerfilForm` |
| `src/app/mi-panel/perfil/actions.ts` | Create | `updateDatosContacto` + `updateFotoPerfil` |
| `src/components/socio/PerfilForm.tsx` | Create | Client Component — formulario con `useActionState` |
| `src/components/socio/Sidebar.tsx` | No change | "Mi Perfil" ya está en `navItems` con href correcto |

## Interfaces / Contracts

```typescript
// ProfesionalRepository — nuevo método
type UpdateProfesionalData = {
  telefono?: string;
  whatsapp?: string;
  direccion?: string;
  horarios?: string;
  foto_url?: string;
};

static async update(userId: string, data: UpdateProfesionalData) {
  return prisma.profesional.update({
    where: { userId },
    data,
  });
}

// Server Action return type (consistente con el proyecto)
type ActionResult = { success: true } | { success: false; error: string };
```

```typescript
// PerfilForm — props
interface PerfilFormProps {
  profesional: {
    nombre: string;
    apellido: string;
    matricula: string;
    telefono: string | null;
    whatsapp: string | null;
    direccion: string | null;
    horarios: string | null;
    foto_url: string | null;
  };
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `ProfesionalRepository.update` — userId inexistente | Manual (no test runner) |
| Integration | Server Actions — autorización + persistencia | Manual en dev |
| E2E | Flujo completo: editar + guardar + ver reflejado en Padrón | Manual en dev |

*No hay test runner configurado en el proyecto (Strict TDD: disabled).*

## Migration / Rollout

No migration required. Los campos editables (`telefono`, `whatsapp`, `direccion`, `horarios`, `foto_url`) ya existen en el schema de Prisma. No se requiere `prisma migrate`.

El bucket de Supabase Storage `profesionales-fotos` debe crearse manualmente en el dashboard
de Supabase con acceso público (para que `getPublicUrl` funcione sin firma).

## Open Questions

- [x] ¿Se mantiene la foto anterior al subir una nueva, o se borra del bucket? → **DECIDIDO: se borra la anterior**. `updateFotoPerfil` elimina el archivo previo de Storage antes de subir el nuevo, si `foto_url` ya existe.
