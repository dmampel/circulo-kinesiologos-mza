# capacitaciones-socio Specification

## Purpose
TBD - created by archiving change detalle-capacitacion-socio. Update Purpose after archive.
## Requirements
### Requirement: Cards de cartelera enlazan a la página de detalle
Los cards de la cartelera en `/mi-panel/capacitaciones` SHALL incluir un enlace (`<Link>`) a la página de detalle `/mi-panel/capacitaciones/[id]` de cada capacitación. El título del evento SHALL ser el elemento principal enlazado. Las cards SHALL mostrar el costo formateado con locale `es-AR` (punto como separador de miles), usando `toLocaleString("es-AR")`. El formato deberá mostrar `$2.000` en lugar de `$2,000`.

#### Scenario: Click en card de cartelera
- **WHEN** el socio hace click en el título de un card de capacitación en la cartelera
- **THEN** el navegador navega a `/mi-panel/capacitaciones/[id]` con el ID correspondiente

#### Scenario: Precio con miles se formatea correctamente
- **WHEN** una capacitación tiene `costo = 2000`
- **THEN** la card muestra `$2.000`

#### Scenario: Precio cero o gratuito
- **WHEN** una capacitación tiene `costo = 0` o `costo = null`
- **THEN** la card muestra "Gratuito" o `$0` según el componente existente

### Requirement: Revalidación de ruta de detalle al inscribirse o cancelar
Las Server Actions `inscribirseACapacitacion` y `cancelarInscripcionSocio` SHALL revalidar todas las rutas bajo `/mi-panel/capacitaciones/` usando `revalidatePath("/mi-panel/capacitaciones", "layout")`.

#### Scenario: Inscripción desde la página de detalle
- **WHEN** el socio completa la inscripción desde `/mi-panel/capacitaciones/[id]`
- **THEN** la página de detalle se actualiza reflejando el nuevo estado de inscripción

#### Scenario: Cancelación desde la página de detalle
- **WHEN** el socio cancela su inscripción desde `/mi-panel/capacitaciones/[id]`
- **THEN** la página de detalle se actualiza reflejando el estado cancelado

