# Diseño Técnico: Gestión de Categorías

## Componentes de UI

### Sidebar (`CategoriaSidebar.tsx`)
- Componente cliente que se integra en `admin/beneficios/page.tsx`.
- Formulario dual: "Crear Nueva" por defecto, cambia a "Editar Categoría" al seleccionar una existente.
- Listado con botones de borrar y editar (el de editar activa el modo edición en el mismo sidebar).

## 1. Infraestructura y Lógica

- [ ] 1.1 Implementar Server Actions en `src/app/admin/beneficios/categoria-actions.ts` (CRUD completo).
- [ ] 1.2 Asegurar que `BeneficioRepository` incluya la relación con categorías en todos los queries.

## 2. Interfaz de Usuario (Admin)

- [ ] 2.1 Actualizar `CategoriaSidebar.tsx` con soporte para edición interna (Modo Edición).
- [ ] 2.2 Integrar el Sidebar en `src/app/admin/beneficios/page.tsx`.
- [ ] 2.3 Refactorizar la tabla de beneficios en el admin para mostrar el nombre de la categoría dinámicamente.
- [ ] 2.4 Asegurar que la página de edición de beneficios (`admin/beneficios/editar/[id]`) use categorías dinámicas.

## Lógica de Servidor

### Actions (`categoria-actions.ts`)
- `crearCategoria`: Valida datos y genera slug.
- `actualizarCategoria`: Actualiza nombre, icono y color de una categoría existente.
- `eliminarCategoria`: Verifica que no haya beneficios asociados antes de borrar.

## Integración
- Se actualizará el listado de beneficios para que en la columna "Categoría" se muestre el nombre dinámico (`beneficio.categoria.nombre`) en lugar del valor del Enum anterior.
