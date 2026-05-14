## 1. NoticiaRepository — método update

- [x] 1.1 Agregar método `update(id: string, data: Partial<Noticia>)` en `src/lib/repositories/NoticiaRepository.ts` que llama a `prisma.noticia.update({ where: { id }, data })` y retorna el registro actualizado

## 2. Server Action — actualizarNoticia

- [x] 2.1 Agregar action `actualizarNoticia(id: string, formData: FormData)` en `src/app/admin/noticias/actions.ts`
- [x] 2.2 La action debe: parsear campos del formData, regenerar slug desde titulo, preservar `publicada_en` si ya estaba publicada o setearla ahora si cambia a publicada
- [x] 2.3 Llamar a `NoticiaRepository.update()` y revalidar `/admin/noticias`, `/noticias`, `/`
- [x] 2.4 Retornar `{ success: boolean, error?: string }`

## 3. Ruta de edición — /admin/noticias/editar/[id]

- [x] 3.1 Crear `src/app/admin/noticias/editar/[id]/page.tsx`
- [x] 3.2 Server wrapper: fetchar la noticia con `NoticiaRepository.getById(id)`, llamar `notFound()` si no existe, pasarla como prop al formulario
- [x] 3.3 Client form: misma estructura que `nueva/page.tsx` con los campos precargados desde la noticia existente
- [x] 3.4 Al submit, llamar `actualizarNoticia(id, formData)` y redirigir a `/admin/noticias` en caso de éxito

## 4. Fix — botón delete noticias

- [x] 4.1 En `src/app/admin/noticias/page.tsx`, wrapear el `<button>` de eliminar en un `<form action={eliminarNoticia.bind(null, n.id)}>` siguiendo el patrón de circulares

## 5. Fix — botón delete beneficios

- [x] 5.1 En `src/app/admin/beneficios/page.tsx`, wrapear el `<button>` de eliminar en un `<form action={eliminarBeneficio.bind(null, b.id)}>` siguiendo el patrón de circulares
- [x] 5.2 Importar `eliminarBeneficio` desde `./actions` si no está importada
