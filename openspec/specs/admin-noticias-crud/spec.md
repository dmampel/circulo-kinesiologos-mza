# Admin Noticias CRUD Specification

## Purpose

Define el comportamiento del CRUD completo de noticias en el panel de administración: edición de noticias existentes y eliminación funcional.

## Requirements

### Requirement: Edición de Noticia

The system MUST allow an admin to edit an existing news article via the route `/admin/noticias/editar/[id]`.

#### Scenario: Carga del formulario de edición

- GIVEN an admin navigates to `/admin/noticias/editar/[id]`
- AND the `id` exists in the database
- WHEN the page loads
- THEN the system MUST fetch the article using `NoticiaRepository.getById(id)`
- AND the system MUST pre-fill all form fields with the existing data (titulo, resumen, contenido, imagen_url, publicada)
- AND the system MUST display a preview of the existing imagen_url if present.

#### Scenario: Noticia no encontrada al editar

- GIVEN an admin navigates to `/admin/noticias/editar/[id]`
- AND the `id` does NOT exist in the database
- WHEN the page loads
- THEN the system MUST invoke Next.js `notFound()`.

#### Scenario: Guardar cambios exitosamente

- GIVEN an admin has edited one or more fields in the edit form
- WHEN the admin submits the form
- THEN the system MUST call `actualizarNoticia(id, formData)`
- AND the system MUST update all fields in the database via `NoticiaRepository.update()`
- AND the system MUST regenerate the slug from the updated titulo
- AND if `publicada` changes from false to true, MUST set `publicada_en` to the current timestamp
- AND if `publicada` was already true, MUST preserve the original `publicada_en`
- AND the system MUST revalidate paths `/admin/noticias`, `/noticias`, and `/`
- AND the system MUST redirect to `/admin/noticias` on success.

### Requirement: Eliminación de Noticia

The system MUST allow an admin to delete a news article from the list page.

#### Scenario: Eliminar noticia

- GIVEN the admin clicks the delete button for a noticia in the list
- WHEN the form is submitted
- THEN the system MUST call `eliminarNoticia(id)`
- AND the system MUST delete the record from the database
- AND the system MUST revalidate `/admin/noticias`.

### Requirement: Eliminación de Beneficio

The system MUST allow an admin to delete a beneficio from the list page.

#### Scenario: Eliminar beneficio

- GIVEN the admin clicks the delete button for a beneficio in the list
- WHEN the form is submitted
- THEN the system MUST call `eliminarBeneficio(id)`
- AND the system MUST delete the record from the database
- AND the system MUST revalidate `/admin/beneficios`.
