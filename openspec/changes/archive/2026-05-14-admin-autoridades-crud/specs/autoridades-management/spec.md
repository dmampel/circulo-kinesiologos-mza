# Delta for autoridades-management

## ADDED Requirements

### Requirement: Gestión de Autoridades en Panel Admin
El sistema DEBE proveer una interfaz en el panel de administración para listar, crear, editar y eliminar autoridades.

#### Scenario: Acceso al listado de autoridades
- GIVEN un usuario administrador autenticado
- WHEN accede a `/admin/autoridades`
- THEN el sistema DEBE mostrar una tabla con todas las autoridades actuales, su cargo y el nombre del profesional vinculado.

#### Scenario: Selección de profesional para nueva autoridad
- GIVEN la interfaz de creación de autoridad
- WHEN el administrador busca a un profesional por nombre, apellido o matrícula
- THEN el sistema DEBE permitir seleccionar a un profesional existente del padrón para vincularlo al nuevo cargo.

### Requirement: Ordenamiento Manual de Autoridades
El sistema DEBE permitir al administrador modificar el orden de visualización de las autoridades.

#### Scenario: Cambio de orden
- GIVEN la interfaz de gestión de autoridades
- WHEN el administrador modifica el valor del campo `orden` de un registro
- THEN el sistema DEBE persistir el cambio y revalidar la caché de la página institucional.

### Requirement: Eliminación de Autoridades
El sistema DEBE permitir remover a un profesional de la Comisión Directiva sin afectar su registro en el padrón de profesionales.

#### Scenario: Eliminar autoridad
- GIVEN una autoridad existente
- WHEN el administrador selecciona la opción "Eliminar"
- THEN el registro de la tabla `Autoridad` DEBE ser borrado
- AND el registro del `Profesional` vinculado DEBE permanecer intacto en el padrón.
