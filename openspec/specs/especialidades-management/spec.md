# especialidades-management Specification

## Purpose
CRUD de especialidades de profesionales desde el panel admin. Sidebar deslizante en `/admin/profesionales` que permite crear, editar y eliminar especialidades. Reemplaza el hardcodeo de 3 opciones en el formulario de registro.

## Requirements

### Requirement: Listar especialidades existentes
El sistema DEBE mostrar todas las especialidades almacenadas en la BD en el sidebar de gestión del panel admin.

#### Scenario: Admin abre el sidebar de especialidades
- **WHEN** el admin hace clic en "Gestionar Especialidades" desde `/admin/profesionales`
- **THEN** el sidebar se abre y muestra la lista de especialidades ordenadas alfabéticamente

#### Scenario: No hay especialidades creadas
- **WHEN** el admin abre el sidebar y la tabla `Especialidad` está vacía
- **THEN** el sistema muestra un estado vacío sin errores

### Requirement: Crear especialidad
El sistema DEBE permitir al admin crear una nueva especialidad con un nombre único.

#### Scenario: Creación exitosa
- **WHEN** el admin ingresa un nombre válido y envía el formulario
- **THEN** la especialidad se persiste en BD, el listado se refresca y el formulario se limpia

#### Scenario: Nombre duplicado
- **WHEN** el admin intenta crear una especialidad con un nombre ya existente
- **THEN** el sistema devuelve un error y no crea el registro duplicado

### Requirement: Editar especialidad
El sistema DEBE permitir al admin modificar el nombre de una especialidad existente.

#### Scenario: Edición exitosa
- **WHEN** el admin hace clic en editar, modifica el nombre y guarda
- **THEN** el nombre se actualiza en BD y el listado refleja el cambio inmediatamente

#### Scenario: Editar con nombre duplicado
- **WHEN** el admin intenta renombrar a un nombre ya usado por otra especialidad
- **THEN** el sistema devuelve error y mantiene el valor original

### Requirement: Eliminar especialidad
El sistema DEBE permitir eliminar una especialidad solo si no tiene profesionales asociados.

#### Scenario: Eliminación exitosa
- **WHEN** la especialidad no tiene profesionales asociados y el admin confirma la eliminación
- **THEN** el registro se elimina de BD y desaparece del listado

#### Scenario: Eliminar especialidad con profesionales asociados
- **WHEN** la especialidad tiene al menos un profesional asociado
- **THEN** el sistema rechaza la eliminación y muestra un mensaje de error explicativo
