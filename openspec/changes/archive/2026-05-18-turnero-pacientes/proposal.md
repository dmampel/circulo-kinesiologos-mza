# Proposal: Turnero de Pacientes

## Intent

Los kinesiólogos del Círculo necesitan gestionar los turnos de sus propios pacientes desde el portal del socio (`/mi-panel`). Hoy no existe ninguna herramienta para esto — lo hacen en papel, WhatsApp o agenda externa. El objetivo es un módulo propio dentro del portal, simple, elegante y privado por profesional.

## Scope

### In Scope
- CRUD de **Pacientes** propios del kinesiólogo (nombre, apellido, DNI, teléfono, email, notas)
- CRUD de **Turnos** (fecha, hora, duración, paciente, motivo, estado: PENDIENTE/CONFIRMADO/CANCELADO/COMPLETADO)
- **Vista de agenda semanal** (lectura): semana actual con navegación prev/next, turnos agrupados por día
- **Widget en dashboard** (`/mi-panel`): próximos turnos del día
- **Nuevo ítem "Turnos"** en el sidebar del portal del socio
- Prisma schema: modelos `Paciente` + `Turno`

### Out of Scope
- Autogestión del paciente (formulario público para pedir turno)
- Recordatorios por email/WhatsApp
- Historial clínico / notas de sesión
- Configuración de disponibilidad/horarios
- Vista mensual

## Capabilities

### New Capabilities
- `gestion-pacientes`: CRUD de pacientes privados por profesional
- `turnero-profesional`: gestión de turnos (CRUD + vista semanal + widget dashboard)

### Modified Capabilities
- `portal-socio-dashboard`: se agrega widget de próximos turnos del día

## Approach

Implementación por capas siguiendo el patrón del proyecto:

1. **DB**: `Prisma` — modelos `Paciente` y `Turno` con relación `profesionalId` para aislamiento por profesional.
2. **Repositories**: `PacienteRepository` + `TurnoRepository` en `src/lib/repositories/`.
3. **Server Actions**: co-ubicadas en `src/app/mi-panel/turnos/actions.ts`.
4. **UI**: Server Components por defecto; Client Components solo para formularios y navegación de semana.
5. **Seguridad**: todos los queries filtran por `profesionalId` del usuario autenticado.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Agregar `Paciente`, `Turno`, enum `EstadoTurno` |
| `src/lib/repositories/PacienteRepository.ts` | New | CRUD filtrado por profesionalId |
| `src/lib/repositories/TurnoRepository.ts` | New | CRUD + queries de agenda semanal |
| `src/app/mi-panel/turnos/` | New | Página agenda + subpáginas CRUD |
| `src/app/mi-panel/turnos/pacientes/` | New | Gestión de pacientes |
| `src/app/mi-panel/page.tsx` | Modified | Widget próximos turnos |
| `src/components/socio/Sidebar.tsx` | Modified | Ítem "Turnos" en nav |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Datos de un profesional visibles para otro | Med | Filtro `profesionalId` en TODOS los repos, nunca exponer por ID sin validar ownership |
| Timezone Mendoza (UTC-3) | Med | Guardar en UTC, formatear en cliente con `Intl.DateTimeFormat` con `timeZone: "America/Argentina/Mendoza"` |
| Migración en producción (Supabase) | Low | Usar `prisma migrate deploy` en staging antes de producción |

## Rollback Plan

- Si falla la migración: `prisma migrate resolve --rolled-back` para marcar como revertida.
- Los modelos `Paciente` y `Turno` son independientes — no rompen ningún modelo existente.
- El widget del dashboard es aditivo: si falla el query, mostrar vacío sin romper el resto.

## Dependencies

- Prisma migration aplicada en Supabase antes de deploy a producción.

## Success Criteria

- [ ] El kinesiólogo puede crear/editar/eliminar pacientes propios
- [ ] El kinesiólogo puede agendar, editar y cancelar turnos
- [ ] La vista semanal muestra los turnos del profesional agrupados por día
- [ ] El dashboard muestra los próximos turnos del día
- [ ] Un profesional NO puede ver los pacientes/turnos de otro profesional
- [ ] La experiencia visual es consistente con el resto del portal del socio
