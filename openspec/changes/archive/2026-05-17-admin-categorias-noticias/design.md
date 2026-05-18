## Context

El modelo `CategoriaNoticia` ya existe en `prisma/schema.prisma` con los campos `id`, `nombre`, `slug`, `icono`, `color`, `noticias` y `createdAt`. El repositorio `CategoriaNoticiaRepository` solo tiene métodos de lectura (`getAll`, `getBySlug`, `getById`). No existe ninguna UI en el admin para gestionar estas categorías.

El patrón de referencia es el módulo de categorías de beneficios (`CategoriaBeneficio`), cuya implementación es madura y validada:
- `src/app/admin/beneficios/categoria-actions.ts` — Server Actions
- `src/app/admin/beneficios/CategoriaSidebar.tsx` — Sidebar deslizable
- Integrado en `src/app/admin/beneficios/page.tsx`

## Goals / Non-Goals

**Goals:**
- Permitir crear, editar y eliminar categorías de noticias desde el admin.
- UX idéntica al sidebar de categorías de beneficios (slide-in derecho, formulario dual crear/editar, listado con inline edit/delete).
- Proteger eliminación si la categoría tiene noticias asociadas.
- Reutilizar `CategoriaNoticiaRepository` extendido con métodos de escritura.

**Non-Goals:**
- Cambios al schema de Prisma (el modelo ya existe).
- Migraciones en Supabase (sin tablas nuevas).
- Filtro por categoría en el listado de noticias del admin (ya existe `AdminSearch`).
- Soporte para sub-categorías.

## Decisions

### 1. Reutilizar el patrón CategoriaBeneficio al 100%

El sidebar de beneficios es el estándar del proyecto para gestión inline de entidades auxiliares. Replicarlo para noticias garantiza consistencia de UX sin introducir nueva complejidad.

**Alternativa descartada:** Página separada `/admin/noticias/categorias` — más overhead de navegación para una entidad simple.

### 2. Server Actions en archivo dedicado (`categoria-actions.ts`)

Siguiendo la convención del proyecto, las actions de la entidad auxiliar van en su propio archivo en la carpeta del feature, no mezcladas con `actions.ts` de noticias.

### 3. Extender `CategoriaNoticiaRepository` con métodos de escritura

El repositorio es el punto único de acceso a Prisma. Los métodos `create`, `update` y `delete` se agregan ahí; las Server Actions los invocan en lugar de llamar a Prisma directamente.

**Diferencia con beneficios:** `categoria-actions.ts` en beneficios llama a `prisma` directamente. Aquí se aprovecha para mejorar y pasar por el repositorio, manteniendo la arquitectura limpia.

### 4. Campos: nombre, slug (auto-generado), icono, color

Mismos campos que `CategoriaBeneficio`. El slug se genera automáticamente desde el nombre (normalización NFD + kebab-case). No se expone al usuario.

### 5. Guard de eliminación por noticias asociadas

Antes de eliminar, verificar `noticias._count > 0`. Si tiene noticias, devolver error. Misma lógica que el guard de beneficios.

## Risks / Trade-offs

- **Consistencia icono/color en Tailwind 4**: Las clases dinámicas `bg-${color}-500` pueden ser purgadas en producción. Este riesgo ya existe en el sidebar de beneficios y está aceptado (los colores usados están en el safelist implícito por estar en el código de beneficios).
- **Duplicación de lógica de slug**: La generación de slug está duplicada entre actions de beneficios y de noticias. Refactorizar a un `slugify` utilitario es deseable pero fuera del scope de este change.
