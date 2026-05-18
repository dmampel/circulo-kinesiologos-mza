## ADDED Requirements

### Requirement: Crear categoría de noticia
El sistema SHALL permitir a un administrador crear una nueva categoría de noticia con nombre, icono y color desde el panel admin.

#### Scenario: Creación exitosa
- **WHEN** el administrador completa el formulario con nombre, icono y color y envía
- **THEN** se crea el registro en `CategoriaNoticia` con slug auto-generado desde el nombre y se recarga la página

#### Scenario: Nombre duplicado
- **WHEN** el administrador intenta crear una categoría con un nombre ya existente
- **THEN** la Server Action devuelve `{ success: false, error: <mensaje> }` y no se crea el registro

### Requirement: Editar categoría de noticia
El sistema SHALL permitir modificar el nombre, icono y color de una categoría existente sin cambiar su `id`.

#### Scenario: Edición exitosa
- **WHEN** el administrador selecciona "editar" en una categoría, modifica campos y guarda
- **THEN** el registro se actualiza en base de datos (incluyendo el slug recalculado) y la UI refleja los cambios

### Requirement: Eliminar categoría de noticia
El sistema SHALL permitir eliminar una categoría solo si no tiene noticias asociadas.

#### Scenario: Eliminación exitosa
- **WHEN** el administrador elimina una categoría sin noticias asociadas
- **THEN** el registro se elimina y desaparece del listado

#### Scenario: Eliminación bloqueada
- **WHEN** el administrador intenta eliminar una categoría con una o más noticias asociadas
- **THEN** la Server Action devuelve `{ success: false, error: "No se puede eliminar una categoría con noticias asociadas." }` y el registro no se elimina

### Requirement: Sidebar de gestión de categorías
El sistema SHALL mostrar un botón "Gestionar Categorías" en la página `/admin/noticias` que abre un panel deslizable con el CRUD de categorías.

#### Scenario: Apertura del panel
- **WHEN** el administrador hace click en "Gestionar Categorías"
- **THEN** se despliega un sidebar desde la derecha con el formulario de nueva categoría y el listado de categorías existentes

#### Scenario: Cierre del panel
- **WHEN** el administrador hace click en la X o en el backdrop
- **THEN** el sidebar se cierra sin modificar el estado de la lista de noticias
