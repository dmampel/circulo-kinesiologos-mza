# detalle-capacitacion-socio Specification

## Purpose
TBD - created by archiving change detalle-capacitacion-socio. Update Purpose after archive.
## Requirements
### Requirement: Página de detalle de capacitación para el socio
El sistema SHALL proveer una ruta `/mi-panel/capacitaciones/[id]` que muestre la información completa de una capacitación publicada, incluyendo descripción sin truncar, fecha, hora del evento, ubicación, cupos disponibles y costo.

#### Scenario: Acceso a capacitación publicada
- **WHEN** un socio autenticado navega a `/mi-panel/capacitaciones/[id]` con un ID válido de capacitación publicada
- **THEN** el sistema muestra la página de detalle con toda la información de la capacitación

#### Scenario: Acceso a capacitación no publicada o inexistente
- **WHEN** un socio autenticado navega a `/mi-panel/capacitaciones/[id]` con un ID de capacitación no publicada o inexistente
- **THEN** el sistema retorna una página 404

#### Scenario: Acceso sin autenticación
- **WHEN** un usuario no autenticado navega a `/mi-panel/capacitaciones/[id]`
- **THEN** el sistema redirige a `/login`

### Requirement: Hora del evento visible
El sistema SHALL mostrar la hora del evento (`fechaInicio`) en formato HH:MM con locale `es-AR`. Si la hora es medianoche UTC (00:00), el dato de hora SHALL omitirse.

#### Scenario: Capacitación con hora definida
- **WHEN** `fechaInicio` tiene hora distinta de medianoche UTC
- **THEN** la página muestra la hora en formato "HH:MM hs"

#### Scenario: Capacitación sin hora definida
- **WHEN** `fechaInicio` tiene hora en medianoche UTC (00:00)
- **THEN** la página omite el dato de hora del evento

### Requirement: Estado de inscripción del socio en la página de detalle
El sistema SHALL mostrar el estado actual de inscripción del socio autenticado y las acciones disponibles según ese estado.

#### Scenario: Socio no inscripto y con cupos disponibles
- **WHEN** el socio no tiene inscripción activa y hay cupos disponibles
- **THEN** se muestra el botón "Inscribirme" (`BotonInscripcion`)

#### Scenario: Socio inscripto
- **WHEN** el socio tiene una inscripción activa (PENDIENTE o CONFIRMADA)
- **THEN** se muestra el estado de inscripción y el botón "Bajarme" (`BotonCancelarInscripcion`)

#### Scenario: Cupo agotado y socio no inscripto
- **WHEN** el `cupoMaximo` está alcanzado y el socio no tiene inscripción activa
- **THEN** se muestra el mensaje "Cupo Agotado" en lugar del botón de inscripción

