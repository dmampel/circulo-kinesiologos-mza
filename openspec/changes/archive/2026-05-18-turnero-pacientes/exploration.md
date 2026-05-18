## Exploration: Turnero / Agenda de Pacientes

### Current State

El portal del socio (`/mi-panel`) ya existe con:
- **Auth**: Supabase Auth + `Profesional` vinculado por `userId`
- **Layout**: Sidebar + MobileSidebarShell (responsive, drawer en mobile)
- **Agenda existente**: sección de capacitaciones/inscripciones en dashboard — patrón semana actual + lista de eventos. Es solo lectura, no es editable.
- **Patrones establecidos**: Server Components por defecto, repositories en `src/lib/repositories/`, server actions en `actions.ts` co-ubicadas con las páginas.
- **Prisma schema**: modelos `Profesional`, `Capacitacion`, `InscripcionCapacitacion` como referencia de relaciones.
- **Sin testing**: no hay vitest. Verificación manual.

El kinesiólogo **no tiene hoy ninguna forma de gestionar pacientes ni turnos propios**.

### Affected Areas

- `prisma/schema.prisma` — nuevos modelos `Paciente`, `Turno`
- `src/lib/repositories/` — `PacienteRepository.ts`, `TurnoRepository.ts`
- `src/app/mi-panel/` — nueva sección `/mi-panel/turnos/`
- `src/components/socio/Sidebar.tsx` — agregar ítem "Turnos" al sidebar
- `src/app/mi-panel/page.tsx` — widget de próximos turnos en el dashboard

### Approaches

1. **Turnos simples (sin slots de disponibilidad)**
   - El kinesiólogo crea/edita turnos manualmente: fecha, hora, paciente, motivo, estado.
   - No hay configuración de horarios disponibles ni autogestión del paciente.
   - Pros: simple, rápido de implementar, encaja con el MVP, control total del profesional.
   - Cons: no escala si queremos autogestión futura.
   - Effort: Medium (~6-8 sesiones de trabajo)

2. **Agenda con bloques de disponibilidad + reserva manual**
   - El profesional configura sus horarios disponibles (lunes 9-13, etc.) y luego reserva slots para pacientes.
   - Pros: más rico en UX, base para autogestión futura.
   - Cons: mucho más complejo de modelar y construir; riesgo de over-engineering para el MVP.
   - Effort: High (~15+ sesiones)

3. **Calendario semanal editable (tipo Google Calendar lite)**
   - Vista de semana con drag-and-drop, creación inline de turnos.
   - Pros: UX premium.
   - Cons: requiere librerías de calendario o implementación compleja; fuera de scope MVP.
   - Effort: Very High

### Recommendation

**Opción 1 — Turnos simples**, con buena UX.

El modelo de datos es:
- `Paciente`: nombre, apellido, dni, telefono, email, notas, `profesionalId` (relación 1:N — el paciente pertenece al kinesiólogo)
- `Turno`: fecha+hora, duracion (minutos), motivo, estado (PENDIENTE/CONFIRMADO/CANCELADO/COMPLETADO), notas, `pacienteId`, `profesionalId`

Features del MVP:
1. CRUD de Pacientes (gestión propia del kinesiólogo)
2. CRUD de Turnos (con selector de paciente, fecha/hora, duración, estado)
3. Vista de agenda semanal (solo lectura, misma estética que el dashboard actual)
4. Widget en dashboard: próximos 3 turnos del día/semana
5. Navegación entre semanas

Esto es extensible luego a: recordatorios por email, disponibilidad pública, historial clínico.

### Risks

- `Paciente` es privado al profesional (RLS o filtro en repo). NUNCA exponer pacientes de otro profesional.
- Timestamps: manejar zona horaria de Mendoza (UTC-3) consistentemente — guardar en UTC, mostrar en local.
- El dashboard ya tiene una sección "Agenda" de capacitaciones. Habrá que integrar el widget de turnos sin duplicar la palabra "Agenda".

### Ready for Proposal

Sí. La propuesta puede arrancar con el modelo de datos, las vistas del portal del socio y la integración en el dashboard.
