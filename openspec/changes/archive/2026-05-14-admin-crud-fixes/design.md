## Context

El admin tiene varias secciones con CRUD incompleto. Las rutas de edición de noticias ya están linkeadas (`/admin/noticias/editar/${id}`) pero la ruta no existe. Los botones de eliminar en noticias y beneficios están renderizados como `<button>` plain sin acción. La referencia a seguir es circulares, que tiene el CRUD completo y correcto.

## Goals / Non-Goals

**Goals:**
- Completar edición de noticias (ruta + action + repository method)
- Completar eliminación de noticias (form action wired)
- Completar eliminación de beneficios (form action wired)

**Non-Goals:**
- Refactor del BeneficioRepository para seguir el patrón completo
- Edición de beneficios (ya funciona)
- Cualquier cambio de schema o migración

## Decisions

**Patrón para el form de edición de noticias**: Reutilizar el formulario de `nueva/page.tsx` prácticamente sin cambios — misma estructura, mismos campos, pero cargando los datos existentes via `NoticiaRepository.getById()` y llamando a `actualizarNoticia()` en lugar de `crearNoticia()`. La ruta será `/admin/noticias/editar/[id]/page.tsx`.

**action `actualizarNoticia()`**: Recibe `id` y `FormData`. Regenera el slug desde el título (misma lógica que crear), actualiza todos los campos. Si `publicada` cambia de false a true, setea `publicada_en` al momento actual; si ya estaba publicada, mantiene la fecha original.

**método `NoticiaRepository.update()`**: Sigue el mismo patrón de `CircularRepository.update()` — recibe `id` y los datos parciales, delega a `prisma.noticia.update()`.

**Botones delete**: Wrapear en `<form action={eliminarNoticia.bind(null, n.id)}>` — idéntico al patrón de circulares. No requiere JS del lado cliente.

## Risks / Trade-offs

- Regenerar slug al editar podría romper URLs existentes si el título cambia → Mitigación: aceptable por ahora dado el volumen bajo de noticias; no se implementa slug inmutable en este change.
- El formulario de edición es un Client Component (hereda de `nueva`) → aceptable, la interactividad del form lo requiere.

## Migration Plan

Sin migraciones de DB. Deploy directo.
