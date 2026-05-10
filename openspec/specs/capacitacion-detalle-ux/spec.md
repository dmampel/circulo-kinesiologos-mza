# capacitacion-detalle-ux Specification

## Purpose
TBD - created by archiving change capacitacion-detalle-ux. Update Purpose after archive.
## Requirements
### Requirement: Datos de pago inline cuando la inscripción está pendiente
Cuando el socio tiene una inscripción en estado `PENDIENTE` y el evento tiene `costo > 0`, la página de detalle SHALL mostrar los datos bancarios (CBU, Alias, Titular) directamente en el card CTA, sin necesidad de abrir un modal.

#### Scenario: Socio con pago pendiente ve datos bancarios
- **WHEN** el socio tiene `inscripcion.estado === "PENDIENTE"` y `capacitacion.costo > 0`
- **THEN** el card CTA muestra CBU, Alias y Titular con los botones de WhatsApp y Email para enviar el comprobante

#### Scenario: Socio sin inscripción no ve datos bancarios
- **WHEN** el socio no tiene inscripción activa
- **THEN** el card CTA muestra únicamente el botón de inscripción, sin datos bancarios

#### Scenario: Inscripción confirmada no muestra datos bancarios
- **WHEN** el socio tiene `inscripcion.estado === "CONFIRMADA"`
- **THEN** el card CTA no muestra datos bancarios (el pago ya fue procesado)

### Requirement: Countdown al evento en el header
La página de detalle SHALL mostrar un badge con los días restantes hasta `fechaInicio`, calculado en el servidor al momento del request.

#### Scenario: Evento en más de 7 días
- **WHEN** `fechaInicio` está a más de 7 días del momento del request
- **THEN** se muestra "Faltan N días"

#### Scenario: Evento en 7 días o menos
- **WHEN** `fechaInicio` está entre 2 y 7 días del momento del request
- **THEN** se muestra "Esta semana · Faltan N días"

#### Scenario: Evento mañana
- **WHEN** `fechaInicio` está a 1 día del momento del request
- **THEN** se muestra "Mañana"

#### Scenario: Evento hoy
- **WHEN** `fechaInicio` es el mismo día del request
- **THEN** se muestra "¡Hoy!"

#### Scenario: Evento ya comenzó
- **WHEN** `fechaInicio` es anterior al momento del request
- **THEN** se muestra "Ya comenzó"

### Requirement: Barra de progreso visual de cupos
Cuando `cupoMaximo` está definido, la página SHALL mostrar una barra de progreso visual que refleje el porcentaje de cupos ocupados, con color semántico según la disponibilidad.

#### Scenario: Cupos con alta disponibilidad
- **WHEN** los cupos ocupados son menos del 60% del total
- **THEN** la barra se muestra en verde

#### Scenario: Cupos con disponibilidad media
- **WHEN** los cupos ocupados están entre el 60% y 85% del total
- **THEN** la barra se muestra en amarillo/ámbar

#### Scenario: Cupos casi agotados
- **WHEN** los cupos ocupados superan el 85% del total
- **THEN** la barra se muestra en rojo

### Requirement: Link a Google Maps para eventos presenciales
Si el evento tiene `modalidad !== "VIRTUAL"` y `ubicacion` tiene valor, la página SHALL mostrar un link externo a Google Maps con la dirección como query de búsqueda.

#### Scenario: Evento presencial con ubicación
- **WHEN** `modalidad` no es `VIRTUAL` y `ubicacion` tiene valor
- **THEN** el ítem de ubicación incluye un link "Ver en Maps →" que abre Google Maps en nueva pestaña con la dirección como búsqueda

#### Scenario: Evento virtual
- **WHEN** `modalidad === "VIRTUAL"`
- **THEN** no se muestra link a Google Maps

