## 1. Repositorio

- [x] 1.1 Agregar método `create(data: { nombre, icono?, color? })` en `CategoriaNoticiaRepository` — genera slug y persiste via Prisma
- [x] 1.2 Agregar método `update(id, data: { nombre, icono?, color? })` — recalcula slug y actualiza el registro
- [x] 1.3 Agregar método `delete(id)` — verifica que no tenga noticias asociadas antes de eliminar

## 2. Server Actions

- [x] 2.1 Crear `src/app/admin/noticias/categoria-actions.ts` con `"use server"`
- [x] 2.2 Implementar `crearCategoria(formData: FormData)` usando `CategoriaNoticiaRepository.create`
- [x] 2.3 Implementar `actualizarCategoria(id, formData: FormData)` usando `CategoriaNoticiaRepository.update`
- [x] 2.4 Implementar `eliminarCategoria(id)` usando `CategoriaNoticiaRepository.delete` — propagar error de guard como `{ success: false, error }`
- [x] 2.5 Llamar `revalidatePath("/admin/noticias")` y `revalidatePath("/noticias")` en cada action exitosa

## 3. Componente Sidebar

- [x] 3.1 Crear `src/app/admin/noticias/CategoriaSidebar.tsx` como Client Component
- [x] 3.2 Implementar estado: `isOpen`, `isPending`, `editingCat`, `nombre`, `selectedIcon`, `selectedColor`
- [x] 3.3 Implementar `useEffect` para sincronizar campos al entrar/salir de modo edición
- [x] 3.4 Implementar `handleSubmit` que llama `crearCategoria` o `actualizarCategoria` según estado
- [x] 3.5 Implementar `handleEliminar` con `confirm()` previo y manejo de error
- [x] 3.6 Renderizar backdrop + panel deslizable con `AnimatePresence` + `motion.div` (framer-motion)
- [x] 3.7 Renderizar selector de iconos (lucide: Tag, Newspaper, Star, Megaphone, BookOpen, Globe, Sparkles)
- [x] 3.8 Renderizar selector de colores (blue, red, green, orange, purple, pink, slate)
- [x] 3.9 Renderizar listado de categorías existentes con botones inline edit/delete (visibles en hover)

## 4. Integración en página admin

- [x] 4.1 En `src/app/admin/noticias/page.tsx`, cargar categorías via `CategoriaNoticiaRepository.getAll()`
- [x] 4.2 Agregar botón "Gestionar Categorías" en el header de la página, junto al botón "Nueva Noticia"
- [x] 4.3 Renderizar `<CategoriaSidebar categorias={categorias} />` en la página
