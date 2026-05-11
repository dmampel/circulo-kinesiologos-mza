# Tasks: circulares-fixes

## Phase 1 — Repository
- [x] 1.1 Agregar `getAllPublished()` a `CircularRepository.ts` — `where: { publicada: true }`, `orderBy: { publicada_en: "desc" }`
- [x] 1.2 Agregar `getPublishedById(id: string)` a `CircularRepository.ts` — `where: { id, publicada: true }`

## Phase 2 — Actions: Zod + Error Handling + Storage Cleanup
- [x] 2.1 Agregar schema Zod `circularSchema` con campos: `titulo` (min 1, max 200), `etiqueta` (min 1, max 50), `contenido` (optional, max 5000), `archivo_url` (url o vacío o null, optional), `publicada` (boolean)
- [x] 2.2 Agregar función helper privada `deleteStorageFile(url: string)` que extrae el path del archivo de la URL pública de Supabase y lo elimina del bucket `circulares-adjuntos`. Solo actúa si la URL contiene `circulares-adjuntos` (para no intentar borrar URLs externas).
- [x] 2.3 Actualizar `createCircular`: validar con `circularSchema.safeParse`, throw si inválido, wrap storage upload en try/catch
- [x] 2.4 Actualizar `updateCircular`: validar con `circularSchema.safeParse`, throw si inválido. Si se sube nuevo archivo Y la `archivo_url` actual apunta al bucket propio → llamar `deleteStorageFile` con la URL anterior antes de subir. Wrap en try/catch.
- [x] 2.5 Actualizar `deleteCircular`: cargar la circular con `getById` antes de eliminar. Si tiene `archivo_url` propia → llamar `deleteStorageFile`. Wrap en try/catch.

## Phase 3 — Admin UI: Eliminar buscador decorativo
- [x] 3.1 En `src/app/admin/circulares/page.tsx`, eliminar el bloque `<div>` con el `<Search>` icon y el `<input>` de búsqueda (líneas 28-35 aprox). Dejar solo el título "Todas las Circulares" en el header de la tabla.

## Phase 4 — Socio: Páginas de detalle e historial
- [x] 4.1 Crear `src/app/mi-panel/circulares/page.tsx` — historial completo. Server Component con auth guard (igual que mi-panel). Llama `getAllPublished()`. Vista de lista estilo agenda (igual que en dashboard, sin límite de 3). Header "Historial de Circulares" con link "← Volver al panel". Diseño premium consistente.
- [x] 4.2 Crear `src/app/mi-panel/circulares/[id]/page.tsx` — detalle de circular. Server Component con auth guard. Llama `getPublishedById(id)`, si no existe → `notFound()`. Muestra: breadcrumb "← Circulares", etiqueta badge, título grande, fecha, contenido (si existe, en bloque de texto formateado), botón "Ver / Descargar archivo" que abre en nueva pestaña (si tiene archivo_url). Diseño premium consistente.

## Phase 5 — Socio: Fix links en mi-panel
- [x] 5.1 En `src/app/mi-panel/page.tsx`, cambiar los dos `Link` de cada circular (título y "Ver más") para que apunten a `/mi-panel/circulares/${circular.id}` en lugar de `circular.archivo_url || "#"`. Eliminar los atributos `target` que abrían en nueva pestaña.
- [x] 5.2 En `src/app/mi-panel/page.tsx`, cambiar el link "Ver historial" de `/novedades` a `/mi-panel/circulares`.

## Phase 6 — Polish: Rediseño y mejoras adicionales
- [x] 6.1 Rediseñar `src/app/mi-panel/circulares/page.tsx` — reemplazar timeline con cards clicables completas. Fecha como bloque visual (día + mes + año), divisor vertical animado, preview de contenido truncado, badge "Adjunto", flecha animada, conteo en el header.
- [x] 6.2 Agregar previsualización de archivo en `src/app/mi-panel/circulares/[id]/page.tsx` — detección de tipo por extensión: PDF → iframe embed (72vh), imagen → `<img>` inline, otros → card con botón de apertura. Barra superior con link "Abrir en nueva pestaña" para PDF e imagen.
- [x] 6.3 Agregar pestaña "Circulares" al sidebar del socio en `src/components/socio/Sidebar.tsx` — ícono `Megaphone`, href `/mi-panel/circulares`, con el mismo comportamiento activo que el resto del nav.
