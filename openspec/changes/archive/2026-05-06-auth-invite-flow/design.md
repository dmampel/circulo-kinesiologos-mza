# Design: Auth Invite Flow

## Technical Approach

Implementaremos la creación automática de usuarios en Supabase Auth utilizando privilegios administrativos (Service Role) durante el proceso de aprobación de solicitudes. Esto asegura que cada `Profesional` en nuestra base de datos tenga una identidad correspondiente en el proveedor de autenticación desde el primer momento.

## Architecture Decisions

### Decision: Cliente Supabase Administrativo
**Choice**: Crear un cliente dedicado en `src/lib/supabase/admin.ts` utilizando la `SUPABASE_SERVICE_ROLE_KEY`.
**Alternatives considered**: Usar el cliente estándar de cliente/servidor.
**Rationale**: Las acciones de invitar usuarios (`inviteUserByEmail`) requieren permisos administrativos que el cliente estándar (basado en cookies o anon key) no posee por diseño de seguridad (RLS).

### Decision: Flujo de Persistencia
**Choice**: Invitar a Supabase Auth PRIMERO, luego crear en Prisma.
**Alternatives considered**: Inverso.
**Rationale**: Si Prisma falla después de que Supabase creó el usuario, tenemos un "usuario huérfano" que es más fácil de limpiar manualmente que un registro de Prisma que apunta a un Auth ID inexistente, lo cual rompería la integridad de la aplicación.

## Data Flow

    [Admin: Clic Aprobar]
         │
    [Server Action: gestionarSolicitud]
         │
    [supabaseAdmin.auth.admin.inviteUserByEmail(email)] ──→ [Supabase Auth]
         │                                                      │
    (Recibe user.id) ←──────────────────────────────────────────┘
         │
    [Prisma.profesional.create({ data: { ..., userId: user.id } })]
         │
    [Prisma.solicitud.update(status: APROBADA)]

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/supabase/admin.ts` | Create | Inicializa el cliente con Service Role Key. |
| `src/app/admin/solicitudes/actions.ts` | Modify | Integra la llamada a Supabase antes de la creación en Prisma. |

## Interfaces / Contracts

```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | Creación de Usuario | Aprobar una solicitud de prueba y verificar en el dashboard de Supabase la existencia del nuevo usuario con status "Invited". |
| Data Integrity | Vinculación de IDs | Verificar en Prisma Studio que el campo `userId` del `Profesional` coincide con el ID de Supabase. |
| Error Handling | Email duplicado | Intentar aprobar una solicitud con un email que ya existe en Supabase Auth y verificar que la acción devuelve un error amigable. |

## Migration / Rollout

No requiere migración de datos. Los registros existentes de `Profesional` quedarán con `userId: null` hasta que se les asocie una cuenta manualmente si fuera necesario.

## Open Questions

- [ ] ¿Qué sucede si el administrador intenta aprobar dos veces la misma solicitud antes de que se refresque la UI? (Se asume que la UI deshabilita el botón tras el primer clic).
