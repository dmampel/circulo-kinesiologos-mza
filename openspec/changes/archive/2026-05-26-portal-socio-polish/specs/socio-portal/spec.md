## ADDED Requirements

### Requirement: Dashboard muestra status real del profesional
La card de cabecera del dashboard SHALL mostrar el campo `profesional.status` como badge (ACTIVO → verde, INACTIVO → gris). El texto "Vencimiento: Dic 2026" hardcodeado SHALL ser eliminado.

#### Scenario: Profesional activo
- **WHEN** el profesional tiene `status = ACTIVO`
- **THEN** la card muestra un badge verde con el texto "Activo"

#### Scenario: Profesional inactivo
- **WHEN** el profesional tiene `status = INACTIVO`
- **THEN** la card muestra un badge gris con el texto "Inactivo"

#### Scenario: Sin campo vencimiento
- **WHEN** el dashboard se renderiza
- **THEN** no aparece ningún campo "Vencimiento" en la card de cabecera

### Requirement: Agenda diferencia días pasados del día actual
En la agenda semanal del dashboard, los días anteriores al día actual SHALL mostrarse visualmente apagados (opacidad reducida). El día actual SHALL mantener su estilo destacado existente.

#### Scenario: Días pasados en el week strip
- **WHEN** un día de la semana tiene fecha anterior a hoy
- **THEN** el número del día y su etiqueta se renderizan con `opacity-40` o equivalente

#### Scenario: Eventos de días pasados en el timeline
- **WHEN** un evento (turno o capacitación) pertenece a un día anterior a hoy
- **THEN** el ítem se muestra con opacidad reducida y sin efecto hover interactivo

#### Scenario: Día actual no se ve afectado
- **WHEN** un día es el día de hoy (`esHoy = true`)
- **THEN** su estilo destacado (fondo azul) se mantiene sin cambios

### Requirement: Turnos pasados se marcan automáticamente como COMPLETADO
Al cargar el dashboard, el sistema SHALL actualizar en batch todos los turnos del profesional cuya fecha ya pasó y cuyo estado sea PENDIENTE o CONFIRMADO, cambiándolos a COMPLETADO.

#### Scenario: Turno pasado en estado PENDIENTE
- **WHEN** el dashboard carga y existen turnos con `fecha < now()` y `estado = PENDIENTE`
- **THEN** esos turnos se actualizan a `estado = COMPLETADO` antes de renderizar la agenda

#### Scenario: Turno pasado en estado CONFIRMADO
- **WHEN** el dashboard carga y existen turnos con `fecha < now()` y `estado = CONFIRMADO`
- **THEN** esos turnos se actualizan a `estado = COMPLETADO` antes de renderizar la agenda

#### Scenario: Turno cancelado no se modifica
- **WHEN** un turno tiene `estado = CANCELADO` y fecha pasada
- **THEN** su estado permanece CANCELADO sin cambios

#### Scenario: Turno futuro no se modifica
- **WHEN** un turno tiene `fecha >= now()`
- **THEN** su estado no es modificado por el batch
