# Turnero Profesional — Specification

## Purpose

Cada kinesiólogo MUST poder gestionar su agenda de turnos de pacientes desde el portal del socio. Los turnos son privados por profesional. La vista principal es una agenda semanal navegable.

## Requirements

### Requirement: Crear Turno

El sistema MUST permitir crear un turno con: paciente (requerido, de la lista propia), fecha (requerida), hora de inicio (requerida), duración en minutos (requerido, default 50), motivo (opcional), estado inicial PENDIENTE, notas (opcional).

#### Scenario: Creación exitosa

- GIVEN que el profesional está en el formulario de nuevo turno
- WHEN selecciona un paciente propio, completa fecha y hora, y guarda
- THEN el turno se crea con `profesionalId` y `pacienteId` correctos y estado PENDIENTE

#### Scenario: Sin pacientes registrados

- GIVEN que el profesional no tiene pacientes creados
- WHEN intenta crear un turno
- THEN el sistema MUST redirigir o invitar a crear un paciente primero

#### Scenario: Conflicto de horario

- GIVEN que el profesional ya tiene un turno a las 10:00 del martes
- WHEN intenta crear otro turno a las 10:00 del mismo día
- THEN el sistema SHOULD advertir del solapamiento (no bloquea, solo advierte)

---

### Requirement: Cambiar Estado de Turno

El sistema MUST permitir cambiar el estado de un turno entre: PENDIENTE → CONFIRMADO → COMPLETADO, o cualquiera → CANCELADO.

#### Scenario: Confirmación de turno

- GIVEN que un turno está en estado PENDIENTE
- WHEN el profesional lo confirma
- THEN el estado cambia a CONFIRMADO

#### Scenario: Cancelación

- GIVEN que un turno está en cualquier estado activo (PENDIENTE/CONFIRMADO)
- WHEN el profesional lo cancela
- THEN el estado cambia a CANCELADO

---

### Requirement: Editar Turno

El sistema MUST permitir editar fecha, hora, duración, motivo y notas de un turno propio. El sistema MUST NOT permitir editar turnos de otro profesional.

#### Scenario: Edición exitosa

- GIVEN que el profesional accede a editar un turno suyo
- WHEN modifica la fecha/hora y guarda
- THEN los cambios persisten en DB

---

### Requirement: Eliminar Turno

El sistema MUST permitir eliminar un turno. Solo turnos CANCELADOS o COMPLETADOS SHOULD ser eliminables sin advertencia.

#### Scenario: Eliminación de turno pendiente

- GIVEN que el turno está en estado PENDIENTE
- WHEN el profesional intenta eliminarlo
- THEN el sistema muestra confirmación antes de proceder

---

### Requirement: Vista de Agenda Semanal

El sistema MUST mostrar una vista de la semana actual con los turnos del profesional agrupados por día. El profesional MUST poder navegar a la semana anterior y siguiente.

#### Scenario: Semana sin turnos

- GIVEN que la semana seleccionada no tiene turnos
- WHEN el profesional la visualiza
- THEN ve los 7 días con estado vacío, sin errores

#### Scenario: Navegación de semana

- GIVEN que el profesional está en la semana actual
- WHEN hace click en "semana siguiente"
- THEN la vista muestra los días y turnos de la semana posterior

#### Scenario: Turno del día resaltado

- GIVEN que hoy hay turnos agendados
- WHEN el profesional ve la agenda
- THEN el día actual aparece visualmente destacado con sus turnos listados

---

### Requirement: Aislamiento de Turnos

El sistema MUST garantizar que los turnos de un profesional no sean accesibles por otro. Todos los queries MUST filtrar por `profesionalId` del usuario autenticado.

#### Scenario: Intento de acceso cruzado

- GIVEN que el profesional B intenta acceder a un turno del profesional A por ID
- WHEN el sistema valida la operación
- THEN retorna 404 o error — el turno de A nunca es expuesto a B
