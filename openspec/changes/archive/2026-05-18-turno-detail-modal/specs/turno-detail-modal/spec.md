## ADDED Requirements

### Requirement: Apertura de detalle desde la agenda
El sistema SHALL permitir al profesional ver el detalle completo de un turno clickeando sobre él en la agenda semanal, sin navegar fuera de la vista.

#### Scenario: Click en turno abre el modal
- **WHEN** el profesional clickea un turno en la agenda semanal
- **THEN** el sistema muestra un panel de detalle (slide-over) con toda la información del turno

#### Scenario: Cierre del modal
- **WHEN** el profesional clickea fuera del panel o el botón de cierre
- **THEN** el panel se cierra y la agenda permanece intacta

---

### Requirement: Visualización de datos del turno
El panel de detalle SHALL mostrar todos los campos del turno: fecha, hora, duración, motivo, notas y estado actual.

#### Scenario: Turno con motivo y notas
- **WHEN** el turno tiene motivo y notas cargadas
- **THEN** el panel muestra ambos campos con su contenido

#### Scenario: Turno sin motivo ni notas
- **WHEN** el turno no tiene motivo ni notas
- **THEN** el panel muestra los campos como vacíos o con placeholder "Sin especificar"

---

### Requirement: Visualización de datos del paciente
El panel SHALL mostrar nombre, apellido, teléfono y email del paciente asociado al turno.

#### Scenario: Paciente con datos de contacto completos
- **WHEN** el paciente tiene teléfono y email registrados
- **THEN** el panel muestra ambos datos con sus respectivos links de acción

#### Scenario: Paciente sin teléfono
- **WHEN** el paciente no tiene teléfono registrado
- **THEN** el botón de WhatsApp no se muestra o aparece deshabilitado

#### Scenario: Paciente sin email
- **WHEN** el paciente no tiene email registrado
- **THEN** el botón de email no se muestra o aparece deshabilitado

---

### Requirement: Contacto por WhatsApp
El sistema SHALL proveer un link directo a WhatsApp con el número del paciente cuando el teléfono esté disponible.

#### Scenario: Link de WhatsApp generado correctamente
- **WHEN** el panel muestra el teléfono del paciente
- **THEN** el botón de WhatsApp abre `https://wa.me/549{telefono}` en una nueva pestaña con el número limpio de caracteres no numéricos

---

### Requirement: Contacto por email
El sistema SHALL proveer un link `mailto:` al email del paciente cuando esté disponible.

#### Scenario: Link de email generado correctamente
- **WHEN** el panel muestra el email del paciente
- **THEN** el botón de email abre el cliente de correo con `mailto:{email}` como destinatario

---

### Requirement: Gestión de estados desde el modal
El profesional SHALL poder cambiar el estado del turno directamente desde el panel de detalle.

#### Scenario: Cambio de estado exitoso
- **WHEN** el profesional selecciona un nuevo estado (Confirmar / Completar / Cancelar / Pendiente)
- **THEN** el sistema actualiza el estado vía `cambiarEstadoTurno`, refleja el cambio visualmente en el panel y actualiza el card en la agenda

#### Scenario: Estado ya activo no se repite como acción principal
- **WHEN** el turno ya tiene un estado (ej: CONFIRMADO)
- **THEN** ese estado se muestra como activo/seleccionado y los demás como opciones disponibles

---

### Requirement: Navegación a edición completa
El panel SHALL ofrecer un botón "Editar" que navega a la página de edición completa del turno.

#### Scenario: Navegación a editar
- **WHEN** el profesional clickea "Editar" en el panel
- **THEN** el sistema navega a `/mi-panel/turnos/[id]/editar`
