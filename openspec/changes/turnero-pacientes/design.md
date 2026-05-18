# Design: Turnero de Pacientes

## Technical Approach

Implementación por capas siguiendo los patrones del proyecto: modelos Prisma → repositories → server actions → Server/Client Components. Todo el aislamiento de datos ocurre en la capa de repositorio. No se usan librerías externas de calendario.

## Architecture Decisions

### Decision: Aislamiento en capa de Repository

**Choice**: Filtro `profesionalId` en todos los métodos de `PacienteRepository` y `TurnoRepository`.
**Alternatives considered**: RLS de Supabase, validación solo en Server Actions.
**Rationale**: El proyecto no usa RLS para ningún modelo existente — sería introducir un nuevo patrón inconsistente. Validar solo en actions es frágil. Los repositories son el único lugar que toca la DB, por lo tanto el lugar correcto.

### Decision: Agenda semanal como Client Component

**Choice**: `AgendaSemanal.tsx` es Client Component (navegación prev/next cambia estado local).
**Alternatives considered**: Server Component con searchParams para la semana.
**Rationale**: El dashboard ya usa el mismo patrón (helpers `getLunesDeSemana`, `isSameDay` en page.tsx). Navegación por searchParams requiere full page reload innecesario para una UI interactiva.

### Decision: Timezone

**Choice**: Guardar `DateTime` en UTC en Prisma (default). Formatear en cliente con `Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Mendoza' })`.
**Alternatives considered**: Guardar en UTC-3 explícito.
**Rationale**: El proyecto ya usa este patrón en capacitaciones y circulares. Consistencia sobre pureza.

### Decision: Conflicto de horario = advertencia, no bloqueo

**Choice**: El sistema calcula solapamientos y muestra warning visual pero permite guardar.
**Rationale**: Un kinesiólogo puede querer tener overlap intencional (paciente en espera, cambio de último momento). Bloquear sería más frustrante que útil en MVP.

## Data Flow

```
Browser (Client Component)
    │
    ├── AgendaSemanal ──→ TurnoRepository.getByProfesionalAndWeek(profesionalId, weekStart)
    │                                             │
    │                                             └─→ prisma.turno.findMany({ where: { profesionalId, ... } })
    │
    └── Form submit ──→ Server Action (actions.ts)
                              │
                              ├── createClient() → supabase.auth.getUser()
                              ├── ProfesionalRepository.findByUserId(userId) → profesionalId
                              └── TurnoRepository.create({ ...data, profesionalId })
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Agregar `Paciente`, `Turno`, enum `EstadoTurno` |
| `src/lib/repositories/PacienteRepository.ts` | Create | CRUD filtrado por `profesionalId` |
| `src/lib/repositories/TurnoRepository.ts` | Create | CRUD + query semanal, filtrado por `profesionalId` |
| `src/app/mi-panel/turnos/page.tsx` | Create | Server Component — obtiene profesionalId, pasa datos a AgendaSemanal |
| `src/app/mi-panel/turnos/AgendaSemanal.tsx` | Create | Client Component — vista semanal navegable con turnos |
| `src/app/mi-panel/turnos/nuevo/page.tsx` | Create | Server Component — form de nuevo turno |
| `src/app/mi-panel/turnos/[id]/editar/page.tsx` | Create | Server Component — carga turno + form edición |
| `src/app/mi-panel/turnos/actions.ts` | Create | Server Actions: crear, actualizar, cambiarEstado, eliminar turno |
| `src/app/mi-panel/turnos/pacientes/page.tsx` | Create | Server Component — lista de pacientes del profesional |
| `src/app/mi-panel/turnos/pacientes/nuevo/page.tsx` | Create | Server Component — form nuevo paciente |
| `src/app/mi-panel/turnos/pacientes/[id]/editar/page.tsx` | Create | Server Component — form edición paciente |
| `src/app/mi-panel/turnos/pacientes/actions.ts` | Create | Server Actions: crear, actualizar, eliminar paciente |
| `src/components/socio/Sidebar.tsx` | Modify | Agregar `{ title: "Turnos", href: "/mi-panel/turnos", icon: CalendarDays }` al array `navItems`. Usar `pathname.startsWith(item.href)` para ítems con subrutas. |
| `src/app/mi-panel/page.tsx` | Modify | Agregar widget "Turnos de Hoy" — query `TurnoRepository.getTodayByProfesional(profesionalId)` |

## Interfaces / Contracts

```prisma
enum EstadoTurno {
  PENDIENTE
  CONFIRMADO
  CANCELADO
  COMPLETADO
}

model Paciente {
  id            String    @id @default(cuid())
  nombre        String
  apellido      String
  telefono      String?
  email         String?
  notas         String?   @db.Text
  profesionalId String
  profesional   Profesional @relation(fields: [profesionalId], references: [id], onDelete: Cascade)
  turnos        Turno[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Turno {
  id            String      @id @default(cuid())
  fecha         DateTime    // UTC
  duracion      Int         @default(50) // minutos
  motivo        String?
  notas         String?     @db.Text
  estado        EstadoTurno @default(PENDIENTE)
  profesionalId String
  profesional   Profesional @relation(fields: [profesionalId], references: [id], onDelete: Cascade)
  pacienteId    String
  paciente      Paciente    @relation(fields: [pacienteId], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Aislamiento profesionalId | Login con 2 cuentas distintas — verificar que no se ven datos cruzados |
| Manual | CRUD pacientes | Crear, editar, intentar eliminar con turnos activos |
| Manual | CRUD turnos | Crear, cambiar estado, navegar semana |
| Manual | Widget dashboard | Verificar que aparece/desaparece según turnos del día |

## Migration / Rollout

1. `npx prisma migrate dev --name add-turnero-pacientes` en local
2. Verificar en staging con `npx prisma migrate deploy`
3. Deploy en producción — no hay datos que migrar (modelos nuevos)
4. Los modelos son independientes — rollback = `prisma migrate resolve --rolled-back` + revert del código

## Open Questions

- [ ] ¿El sidebar debe mostrar el ítem "Turnos" solo si `pathname.startsWith("/mi-panel/turnos")` o debe activarse con match exacto? (Propongo startsWith — hay subrutas de pacientes)
