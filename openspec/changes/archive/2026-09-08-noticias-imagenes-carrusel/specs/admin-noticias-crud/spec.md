# Delta for admin-noticias-crud

## ADDED Requirements

### Requirement: Galería de imágenes de portada en el admin

El formulario de noticia (alta y edición) DEBE permitir al admin gestionar **N imágenes de
portada ordenadas**: subir archivos, agregar por URL, reordenar, borrar y editar el texto
alternativo de cada una.

El control DEBE vivir en un componente cliente reutilizado por `NuevaNoticiaForm` y
`EditarNoticiaForm`, y enviar la lista ordenada al Server Action en un único campo.

#### Scenario: Subida de varias imágenes

- GIVEN un admin en `/admin/noticias/nueva` o `/admin/noticias/editar/[id]`
- WHEN selecciona uno o más archivos de imagen
- THEN el sistema DEBE subirlos **de a uno por request** vía `subirImagenNoticia`
- AND DEBE mostrar el progreso por archivo y la miniatura apenas se resuelve la URL
- AND si un archivo falla, DEBE mostrar el error de ese ítem sin descartar los demás.

#### Scenario: Reordenar imágenes

- GIVEN una galería con al menos dos imágenes
- WHEN el admin arrastra una imagen a otra posición, o usa los controles de mover
- THEN la lista DEBE reflejar el orden nuevo en la UI
- AND la primera posición DEBE señalarse visualmente como "Portada"
- AND el orden DEBE persistirse al guardar el formulario.

#### Scenario: Quitar una imagen

- GIVEN una galería con imágenes cargadas
- WHEN el admin quita una imagen
- THEN desaparece de la lista y las restantes se renumeran
- AND el archivo del bucket `noticias-imagenes` DEBE borrarse recién al guardar la noticia.

#### Scenario: Texto alternativo

- GIVEN una imagen en la galería
- WHEN el admin escribe su texto alternativo
- THEN el valor DEBE persistirse en `NoticiaImagen.alt`
- AND si se deja vacío, el render público DEBE caer al `titulo` de la noticia.

#### Scenario: Carga del formulario de edición con galería

- GIVEN un admin navega a `/admin/noticias/editar/[id]` de una noticia con imágenes
- WHEN la página carga
- THEN el sistema DEBE traer la noticia con `NoticiaRepository.getById(id)` incluyendo `imagenes`
- AND DEBE prellenar la galería con las imágenes en su `orden` guardado.

#### Scenario: Noticia sin ninguna imagen

- GIVEN un admin guarda una noticia con la galería vacía
- WHEN se envía el formulario
- THEN el guardado DEBE ser exitoso (las imágenes son opcionales)
- AND `imagen_url` DEBE quedar en `null`.

### Requirement: Validación de la noticia con Zod

Las Server Actions de noticias DEBEN validar sus inputs con Zod antes de persistir y devolver
siempre `{ success: boolean, error?: string }`.

#### Scenario: Payload de galería inválido

- GIVEN un envío con una URL de imagen inválida o con más de 10 imágenes
- WHEN se ejecuta `crearNoticia` o `actualizarNoticia`
- THEN la action DEBE devolver `{ success: false, error }` con el mensaje de Zod
- AND NO DEBE escribir en la base de datos.

## MODIFIED Requirements

### Requirement: Edición de Noticia

The system MUST allow an admin to edit an existing news article via the route
`/admin/noticias/editar/[id]`.

El campo único "Imagen de Portada (URL)" queda **reemplazado** por la galería de imágenes:
`imagen_url` ya no se edita a mano, se deriva de la primera imagen de la galería.

#### Scenario: Carga del formulario de edición

- GIVEN an admin navigates to `/admin/noticias/editar/[id]`
- AND the `id` exists in the database
- WHEN the page loads
- THEN the system MUST fetch the article using `NoticiaRepository.getById(id)` incluyendo `imagenes`
- AND the system MUST pre-fill all form fields with the existing data (titulo, resumen, contenido, categoriaId, publicada)
- AND the system MUST render la galería con las `imagenes` existentes ordenadas por `orden`.

#### Scenario: Noticia no encontrada al editar

- GIVEN an admin navigates to `/admin/noticias/editar/[id]`
- AND the `id` does NOT exist in the database
- WHEN the page loads
- THEN the system MUST invoke Next.js `notFound()`.

#### Scenario: Guardar cambios exitosamente

- GIVEN an admin has edited one or more fields in the edit form
- WHEN the admin submits the form
- THEN the system MUST call `actualizarNoticia(id, formData)`
- AND the system MUST update all fields in the database via `NoticiaRepository`
- AND the system MUST reconciliar la galería y derivar `imagen_url` de la primera imagen
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
- AND the system MUST delete the record via `NoticiaRepository.delete(id)` (sin `prisma` directo)
- AND las filas de `NoticiaImagen` MUST borrarse en cascada
- AND los archivos de esa noticia en el bucket `noticias-imagenes` MUST borrarse best-effort
- AND the system MUST revalidate `/admin/noticias`.
