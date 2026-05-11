## MODIFIED Requirements

### Requirement: Filtered Searching
The system MUST support filtering by name, locality, specialty, and first letter of the last name.
Specialty filtering MUST use the `Especialidad.id` (not a hardcoded string) as the filter value.

#### Scenario: Searching by specialty
- **WHEN** the user selects a specialty from the filter on the public `/profesionales` page
- **THEN** the repository returns only active professionals associated with that specialty ID

#### Scenario: Searching by name and locality
- **WHEN** the user provides a search query and a locality ID
- **THEN** the repository SHOULD return only active professionals matching both criteria.

## ADDED Requirements

### Requirement: Formulario de registro con especialidades dinámicas
El formulario de registro en `/registro` DEBE cargar las especialidades desde la BD en lugar de usar valores hardcodeados.

#### Scenario: Carga del select de especialidades
- **WHEN** un visitante carga la página `/registro`
- **THEN** el `<select>` de especialidad muestra todas las especialidades activas de la BD, usando `id` como value y `nombre` como label

#### Scenario: BD sin especialidades
- **WHEN** la tabla `Especialidad` está vacía al cargar `/registro`
- **THEN** el select muestra solo la opción placeholder "Seleccioná tu especialidad" sin errores
