## 1. Repository — EspecialidadRepository

- [x] 1.1 Agregar método `create(nombre: string)` en `EspecialidadRepository.ts`
- [x] 1.2 Agregar método `update(id: string, nombre: string)` en `EspecialidadRepository.ts`
- [x] 1.3 Agregar método `deleteById(id: string)` en `EspecialidadRepository.ts`
- [x] 1.4 Agregar método `countProfesionales(id: string)` en `EspecialidadRepository.ts` (para validar antes de eliminar)

## 2. Server Actions — especialidad-actions.ts

- [x] 2.1 Crear `src/app/admin/profesionales/especialidad-actions.ts` con `crearEspecialidad(formData)`
- [x] 2.2 Agregar `actualizarEspecialidad(id, formData)` en el mismo archivo
- [x] 2.3 Agregar `eliminarEspecialidad(id)` con validación de profesionales asociados
- [x] 2.4 Agregar `revalidatePath("/admin/profesionales")` y `revalidatePath("/profesionales")` en cada action

## 3. Componente Sidebar — EspecialidadSidebar.tsx

- [x] 3.1 Crear `src/app/admin/profesionales/EspecialidadSidebar.tsx` con drawer animado (framer-motion)
- [x] 3.2 Implementar formulario dual (crear / editar) con un campo `nombre`
- [x] 3.3 Implementar listado de especialidades con botones editar/eliminar (hover actions)
- [x] 3.4 Conectar con `crearEspecialidad`, `actualizarEspecialidad`, `eliminarEspecialidad`

## 4. Integración en panel admin

- [x] 4.1 Agregar fetch `EspecialidadRepository.getAll()` en `src/app/admin/profesionales/page.tsx`
- [x] 4.2 Renderizar `<EspecialidadSidebar especialidades={especialidades} />` junto al botón existente de acciones

## 5. Fix formulario de registro

- [x] 5.1 Agregar fetch `EspecialidadRepository.getAll()` en `src/app/registro/page.tsx` (Server Component)
- [x] 5.2 Pasar `especialidades` como prop al componente cliente del formulario
- [x] 5.3 Reemplazar las 3 opciones hardcodeadas por `especialidades.map(...)` con `value={esp.id}`
- [x] 5.4 Actualizar `src/app/registro/actions.ts` para usar el `especialidadId` real en el email de notificación

## 6. Filtros combinables en panel admin

- [x] 6.1 Crear `EspecialidadFilter.tsx` — dropdown con param `esp` en URL, flecha custom
- [x] 6.2 Crear `LocalidadFilter.tsx` — dropdown con param `loc` en URL, flecha custom
- [x] 6.3 Actualizar `getProfesionales()` para aceptar `especialidadId` y `localidadId`
- [x] 6.4 Crear `CategoriaFilter.tsx` en beneficios con param `cat` en URL
- [x] 6.5 Actualizar query de beneficios para filtrar por `categoriaId`

## 7. Normalización UX admin — buscador y padding

- [x] 7.1 Mover `AdminSearch` al header de tabla en noticias, circulares, capacitaciones
- [x] 7.2 Mover buscador al header de tabla en obras-sociales, dejar solo botón arriba
- [x] 7.3 Normalizar padding de todos los headers de tabla a `px-8 py-6`
- [x] 7.4 Normalizar celdas de beneficios de `px-4 md:px-8` a `px-8 py-6`
