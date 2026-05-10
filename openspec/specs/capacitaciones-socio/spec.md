# capacitaciones-socio Specification

## Purpose
TBD - created by archiving change detalle-capacitacion-socio. Update Purpose after archive.
## Requirements
### Requirement: Cards de cartelera enlazan a la página de detalle
Los cards de la cartelera en `/mi-panel/capacitaciones` SHALL incluir un enlace (`<Link>`) a la página de detalle `/mi-panel/capacitaciones/[id]` de cada capacitación. El título del evento SHALL ser el elemento principal enlazado.

#### Scenario: Click en card de cartelera
- **WHEN** el socio hace click en el título de un card de capacitación en la cartelera
- **THEN** el navegador navega a `/mi-panel/capacitaciones/[id]` con el ID correspondiente

### Requirement: Revalidación de ruta de detalle al inscribirse o cancelar
Las Server Actions `inscribirseACapacitacion` y `cancelarInscripcionSocio` SHALL revalidar todas las rutas bajo `/mi-panel/capacitaciones/` usando `revalidatePath("/mi-panel/capacitaciones", "layout")`.

#### Scenario: Inscripción desde la página de detalle
- **WHEN** el socio completa la inscripción desde `/mi-panel/capacitaciones/[id]`
- **THEN** la página de detalle se actualiza reflejando el nuevo estado de inscripción

#### Scenario: Cancelación desde la página de detalle
- **WHEN** el socio cancela su inscripción desde `/mi-panel/capacitaciones/[id]`
- **THEN** la página de detalle se actualiza reflejando el estado cancelado

