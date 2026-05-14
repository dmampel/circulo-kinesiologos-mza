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

### Requirement: Manejo de Cargos

Cada autoridad DEBE tener un cargo descriptivo (ej: "Presidente", "Vocal Titular 1°").

#### Scenario: Visualización de cargos
- WHEN se renderiza la lista de autoridades en el frontend
- THEN cada nombre DEBE estar acompañado de su cargo correspondiente de forma clara.
