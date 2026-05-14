# autoridades-management Specification

## Purpose

Esta especificación define cómo se gestionan y visualizan las autoridades (Comisión Directiva) del Círculo de Kinesiólogos. Centraliza la información vinculándola con el padrón de profesionales para asegurar la integridad de los datos.

## Requirements

### Requirement: Almacenamiento Dinámico de Autoridades

El sistema DEBE permitir almacenar y recuperar los miembros de la Comisión Directiva desde la base de datos. Cada registro DEBE contener el cargo y el vínculo al profesional correspondiente.

#### Scenario: Recuperación de la lista de autoridades
- GIVEN que existen registros de autoridades en la base de datos
- WHEN el sistema solicita la lista de autoridades para la página institucional
- THEN el `AutoridadRepository` DEBE retornar los registros incluyendo los datos del `Profesional` (nombre, apellido, matrícula, foto_url).

### Requirement: Vínculo con Padrón de Profesionales

Cada autoridad DEBE estar asociada a un único registro de la tabla `Profesional`. No se permite duplicar información del profesional (como el nombre o la foto) en la tabla de autoridades.

#### Scenario: Cambio de datos del profesional
- GIVEN una autoridad vinculada al profesional "Lic. Juan Pérez"
- WHEN se actualiza el apellido del profesional a "Lic. Juan Pérez Gómez"
- THEN la lista de autoridades DEBE reflejar el cambio automáticamente al ser consultada.

### Requirement: Orden de Visualización

El sistema DEBE permitir definir el orden en que se muestran las autoridades (ej: Presidente primero, luego Vicepresidente, etc.) mediante un campo numérico `orden`.

#### Scenario: Visualización ordenada
- GIVEN una lista de autoridades con diferentes valores en el campo `orden`
- WHEN el sistema solicita la lista de autoridades
- THEN el repositorio DEBE retornar la lista ordenada de forma ascendente según el campo `orden`.

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

### Requirement: Estandarización de Cargos y Orden Automático

El sistema DEBE utilizar una lista predefinida de cargos institucionales. Cada cargo DEBE tener un peso (orden) asociado por defecto para automatizar la jerarquía de visualización.

#### Scenario: Asignación automática de orden
- GIVEN el formulario de gestión de autoridades
- WHEN el administrador selecciona un cargo (ej: "Presidente")
- THEN el sistema DEBE asignar automáticamente el número de orden correspondiente (ej: #1) definido en las constantes del sistema.

### Requirement: Eliminación de Autoridades

El sistema DEBE permitir remover a un profesional de la Comisión Directiva sin afectar su registro en el padrón de profesionales.

#### Scenario: Eliminar autoridad
- GIVEN una autoridad existente
- WHEN el administrador selecciona la opción "Eliminar"
- THEN el registro de la tabla `Autoridad` DEBE ser borrado
- AND el registro del `Profesional` vinculado DEBE permanecer intacto en el padrón.
