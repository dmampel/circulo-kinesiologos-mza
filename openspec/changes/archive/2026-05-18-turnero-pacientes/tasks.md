# Tasks: Turnero de Pacientes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900–1000 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema + Repositories | PR 1 | Base: main. Fundación bloqueante. |
| 2 | Server Actions + Páginas Pacientes | PR 2 | Base: PR 1 branch. CRUD completo de pacientes. |
| 3 | Páginas Turnos + Integración Portal | PR 3 | Base: PR 2 branch. AgendaSemanal + sidebar + widget. |

---

## Phase 1: Infraestructura — Schema y Repositories

- [x] 1.1 Modificar `prisma/schema.prisma`: agregar `enum EstadoTurno`, models `Paciente` y `Turno` según los contratos del design.
- [x] 1.2 Ejecutar `npx prisma db push` y verificar que el schema sincroniza sin errores.
- [x] 1.3 En Supabase SQL Editor: `ALTER TABLE "Paciente" ENABLE ROW LEVEL SECURITY;` y `ALTER TABLE "Turno" ENABLE ROW LEVEL SECURITY;`
- [x] 1.4 Crear `src/lib/repositories/PacienteRepository.ts`: métodos `findAll(profesionalId)`, `findById(id, profesionalId)`, `create(data)`, `update(id, profesionalId, data)`, `delete(id, profesionalId)`. Todos los queries filtran por `profesionalId`.
- [x] 1.5 Crear `src/lib/repositories/TurnoRepository.ts`: métodos `getByProfesionalAndWeek(profesionalId, weekStart)`, `getTodayByProfesional(profesionalId)`, `findById(id, profesionalId)`, `create(data)`, `update(id, profesionalId, data)`, `cambiarEstado(id, profesionalId, estado)`, `delete(id, profesionalId)`.

## Phase 2: Server Actions

- [x] 2.1 Crear `src/app/mi-panel/turnos/pacientes/actions.ts`: actions `crearPaciente`, `actualizarPaciente`, `eliminarPaciente`, `checkTieneTurnos`. Validar inline. Retornar `{ success, error? }`.
- [x] 2.2 Crear `src/app/mi-panel/turnos/actions.ts`: actions `crearTurno`, `actualizarTurno`, `cambiarEstadoTurno`, `eliminarTurno`. Solapamiento detectado con warning en resultado. Validar inline.

## Phase 3: Páginas — Gestión de Pacientes

- [x] 3.1 Crear `src/app/mi-panel/turnos/pacientes/page.tsx`: Server Component — obtiene `profesionalId` del usuario autenticado, lista pacientes vía `PacienteRepository.findAll`, renderiza tabla con acciones editar/eliminar.
- [x] 3.2 Crear `src/app/mi-panel/turnos/pacientes/nuevo/page.tsx`: Server Component — form con campos nombre, apellido, teléfono, email, notas. Submit llama a `crearPaciente`.
- [x] 3.3 Crear `src/app/mi-panel/turnos/pacientes/[id]/editar/page.tsx`: Server Component — carga paciente por ID + `profesionalId`, form pre-cargado. Submit llama a `actualizarPaciente`.

## Phase 4: Páginas — Turnero

- [x] 4.1 Crear `src/app/mi-panel/turnos/AgendaSemanal.tsx`: Client Component — grid semanal 7 columnas, chips con colores por estado, navegación prev/next via router.push con searchParam `semana`.
- [x] 4.2 Crear `src/app/mi-panel/turnos/page.tsx`: Server Component — obtiene profesionalId + weekStart desde searchParams, pasa datos a AgendaSemanal como weekStartISO.
- [x] 4.3 Crear `src/app/mi-panel/turnos/nuevo/page.tsx`: Server Component — carga pacientes, renderiza TurnoForm. CTA si no hay pacientes.
- [x] 4.4 Crear `src/app/mi-panel/turnos/[id]/editar/page.tsx`: Server Component — carga turno + pacientes, form pre-cargado con fecha/hora/estado. Botón eliminar integrado en TurnoForm.

## Phase 5: Integración con Portal del Socio

- [x] 5.1 Modificar `src/components/socio/Sidebar.tsx`: ítem Turnos con CalendarDays agregado. Activación con `startsWith` (excepto Dashboard que usa match exacto).
- [x] 5.2 Modificar `src/app/mi-panel/page.tsx`: widget "Turnos de Hoy" con timeline similar a circulares, colores por estado. Await separado para preservar tipos de proximasInscripciones.

## Phase 6: Verificación Manual

- [ ] 6.1 Login con 2 cuentas distintas — confirmar que cada profesional ve solo sus propios pacientes y turnos (aislamiento por `profesionalId`).
- [ ] 6.2 CRUD pacientes: crear, editar. Intentar eliminar paciente con turnos activos — verificar que aparece advertencia.
- [ ] 6.3 CRUD turnos: crear turno, cambiar estado (PENDIENTE → CONFIRMADO → COMPLETADO), cancelar. Navegar semanas prev/next.
- [ ] 6.4 Conflicto de horario: crear 2 turnos en el mismo horario — confirmar que el sistema advierte pero permite guardar.
- [ ] 6.5 Widget dashboard: verificar que "Turnos de Hoy" aparece con turnos del día y desaparece (empty state) cuando no hay turnos.
- [ ] 6.6 Sidebar: verificar que ítem "Turnos" se activa correctamente en `/mi-panel/turnos` y todas sus subrutas.
