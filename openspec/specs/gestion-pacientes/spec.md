# Gestión de Pacientes — Specification

## Purpose

Cada profesional (kinesiólogo) MUST poder gestionar su propio directorio privado de pacientes desde el portal del socio. Los pacientes son datos personales del profesional y MUST NOT ser accesibles por otros profesionales.

## Requirements

### Requirement: Aislamiento por Profesional

El sistema MUST garantizar que cada profesional solo acceda a sus propios pacientes. Todos los queries MUST filtrar por `profesionalId` del usuario autenticado. El sistema MUST NOT exponer pacientes de un profesional a otro bajo ninguna circunstancia.

#### Scenario: Acceso propio

- GIVEN que el kinesiólogo A está autenticado
- WHEN solicita su lista de pacientes
- THEN recibe solo los pacientes cuyo `profesionalId` coincide con el suyo

#### Scenario: Aislamiento entre profesionales

- GIVEN que el kinesiólogo B intenta acceder a un paciente del kinesiólogo A por ID
- WHEN el sistema valida la operación
- THEN retorna error 404 o redirige — el paciente de A nunca es expuesto a B

---

### Requirement: Crear Paciente

El sistema MUST permitir al profesional autenticado crear un nuevo paciente con los campos: nombre (requerido), apellido (requerido), teléfono (opcional), email (opcional), obra social (opcional), notas (opcional).

#### Scenario: Creación exitosa

- GIVEN que el profesional está autenticado y en el formulario de nuevo paciente
- WHEN completa nombre, apellido y guarda
- THEN el paciente se crea en DB con `profesionalId` del profesional actual
- AND es redirigido a la lista de pacientes

#### Scenario: Campos requeridos vacíos

- GIVEN que el profesional intenta guardar sin nombre o apellido
- WHEN envía el formulario
- THEN el sistema MUST rechazar la operación y mostrar error de validación

---

### Requirement: Editar Paciente

El sistema MUST permitir editar cualquier campo de un paciente propio.

#### Scenario: Edición exitosa

- GIVEN que el profesional accede a editar un paciente suyo
- WHEN modifica datos y guarda
- THEN los cambios persisten en DB y es redirigido a la lista

---

### Requirement: Eliminar Paciente

El sistema MUST permitir eliminar un paciente propio. El sistema SHOULD advertir si el paciente tiene turnos asociados.

#### Scenario: Eliminación con turnos pendientes

- GIVEN que el paciente tiene turnos en estado PENDIENTE o CONFIRMADO
- WHEN el profesional intenta eliminarlo
- THEN el sistema muestra advertencia e impide la eliminación directa

#### Scenario: Eliminación sin turnos activos

- GIVEN que el paciente no tiene turnos activos
- WHEN el profesional confirma la eliminación
- THEN el paciente se elimina de la DB

---

### Requirement: Listar Pacientes

El sistema MUST mostrar la lista de pacientes del profesional con nombre, apellido y teléfono/email. La lista SHOULD ser buscable por nombre o apellido.

#### Scenario: Lista vacía

- GIVEN que el profesional no tiene pacientes registrados
- WHEN accede a la sección de pacientes
- THEN ve un estado vacío con CTA para crear el primero

---

### Requirement: Obra Social del Paciente

El sistema MUST permitir registrar la obra social de un paciente como texto libre opcional. El campo NO MUST ser obligatorio — un paciente puede no tener obra social o el profesional puede no conocerla al momento del alta.

#### Scenario: Alta con obra social

- WHEN el profesional completa el campo obra social al crear o editar un paciente
- THEN el valor se persiste en `Paciente.obraSocial` en la base de datos

#### Scenario: Alta sin obra social

- WHEN el profesional deja el campo obra social vacío
- THEN el paciente se crea/actualiza correctamente con `obraSocial = null`

#### Scenario: Visualización en ficha del paciente

- WHEN el profesional accede al detalle de un paciente que tiene obra social registrada
- THEN el dato se muestra claramente en la ficha
- WHEN el paciente no tiene obra social
- THEN el campo no se muestra o se muestra como "—"
