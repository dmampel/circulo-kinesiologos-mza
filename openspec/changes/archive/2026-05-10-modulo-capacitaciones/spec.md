# Spec: Módulo de Capacitaciones

## Domain
`socio-portal` / `admin-portal`

## Requirements

### Requirement: Modelos de Datos

El sistema DEBE soportar capacitaciones y la inscripción de profesionales a las mismas.

- **Capacitacion**: título, descripción, tipo (Curso, Evento), modalidad (Presencial, Virtual), fechas, ubicación/link, cupo máximo (opcional), costo (opcional), estado (Borrador, Publicada, Finalizada).
- **Inscripcion**: Relaciona a un `Profesional` con una `Capacitacion`. Tiene un estado de inscripción (Pendiente, Confirmada, Cancelada) y fecha.

---

### Requirement: Panel de Administración

El administrador DEBE poder gestionar el ciclo de vida de las capacitaciones y sus inscriptos.

#### Scenario: Crear nueva capacitación
- **GIVEN** que el admin está en `/admin/capacitaciones`
- **WHEN** hace clic en "Nueva" y completa el formulario
- **THEN** la capacitación se guarda y pasa a estado Borrador (o Publicada).

#### Scenario: Gestionar Inscriptos
- **GIVEN** una capacitación con profesionales anotados
- **WHEN** el admin entra al detalle de la capacitación
- **THEN** ve una tabla con los inscriptos
- **AND** puede cambiar el estado de la inscripción (ej. de "Pendiente" a "Confirmada" cuando entra el pago).

---

### Requirement: Portal del Socio

El socio DEBE poder ver la oferta activa y gestionar sus propias inscripciones.

#### Scenario: Ver cartelera
- **GIVEN** que existen capacitaciones publicadas y vigentes
- **WHEN** el socio entra a `/mi-panel/capacitaciones`
- **THEN** ve el listado ordenado por fecha próxima.

#### Scenario: Inscribirse a un curso
- **GIVEN** una capacitación con cupos disponibles
- **WHEN** el socio hace clic en "Inscribirme"
- **THEN** se crea una `Inscripcion` en estado "Pendiente" (o Confirmada si es gratis)
- **AND** el sistema descuenta un cupo disponible
- **AND** si la capacitación tiene costo, se abre un Modal persistente con los datos de transferencia y botones de envío de comprobante (WhatsApp/Email).
- **AND** mientras esté pendiente de pago, el botón muestra estado "Pendiente de Pago".

#### Scenario: Cancelar inscripción
- **GIVEN** que el socio está inscripto a un curso próximo
- **WHEN** hace clic en "Cancelar inscripción"
- **THEN** su inscripción pasa a estado "Cancelada" y se libera el cupo.
