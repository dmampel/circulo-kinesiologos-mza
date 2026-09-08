# Tasks: Múltiples imágenes de portada (carrusel) en Noticias

> Regla transversal: **no tocar** `getPaginated`, `getUltimas`, `getLatest` ni `getRelated` del
> `NoticiaRepository`, ni los listados (`src/app/page.tsx`, `src/app/noticias/page.tsx`,
> `src/app/admin/noticias/page.tsx`), ni el sitemap. Todos siguen leyendo `imagen_url`.
> `imagen_url` se conserva y pasa a escribirse en un solo lugar: `replaceImagenes`.

## 1. DB / Prisma

- [x] 1.1 `prisma/schema.prisma`: agregar el modelo `NoticiaImagen` (`id`, `noticiaId`, `noticia` con `onDelete: Cascade`, `url String`, `alt String?`, `orden Int @default(0)`, `createdAt`, `@@index([noticiaId, orden])`).
- [x] 1.2 `prisma/schema.prisma`: agregar `imagenes NoticiaImagen[]` al modelo `Noticia`. **No** quitar `imagen_url` (queda como cache derivado).
- [x] 1.3 Correr `npx prisma db push` y `npx prisma generate`.
- [x] 1.4 Verificar en Supabase que la tabla `NoticiaImagen` existe con la FK a `Noticia`.

## 2. Supabase

- [x] 2.1 **Bloqueante**: ejecutar en el SQL Editor `ALTER TABLE "NoticiaImagen" ENABLE ROW LEVEL SECURITY;` (pilar 5 de `AGENTS.md`). Sin políticas adicionales: Prisma entra con `service_role`.
- [x] 2.2 Crear el bucket **público** `noticias-imagenes` en Supabase Storage (mismo criterio que `profesionales-fotos`).
- [x] 2.3 Confirmar que la lectura pública del bucket resuelve (`getPublicUrl` de un archivo de prueba abre en el navegador) y que la escritura anónima está denegada.
- [x] 2.4 Verificar que **no** hace falta tocar `next.config.ts`: `images.remotePatterns` ya acepta `{ protocol: "https", hostname: "**" }`.

## 3. Backend

- [x] 3.1 `src/lib/repositories/NoticiaRepository.ts`: agregar `include: { imagenes: { orderBy: { orden: "asc" } } }` a `getById` y `getBySlug`. **Solo** a esos dos.
- [x] 3.2 `NoticiaRepository`: agregar `create(data)` y `delete(id)` para eliminar el uso directo de `prisma` en `actions.ts`.
- [x] 3.3 `NoticiaRepository`: agregar `replaceImagenes(noticiaId, imagenes)` — `prisma.$transaction([deleteMany, createMany con orden: i, update de imagen_url = imagenes[0]?.url ?? null])`. Único punto de escritura de `imagen_url`.
- [x] 3.4 `src/app/admin/noticias/actions.ts`: crear `imagenNoticiaSchema` / `imagenesNoticiaSchema` con Zod (`url` válida, `alt` ≤ 200, array `.max(10)`) y el schema Zod de la noticia (titulo, resumen, contenido, categoriaId, publicada).
- [x] 3.5 `actions.ts`: nueva Server Action `subirImagenNoticia(formData)` → `requireAdmin()`, validar MIME (`image/jpeg|png|webp|avif`) y tamaño ≤ 4 MB **antes** de subir, `supabaseAdmin.storage.from("noticias-imagenes").upload(...)` con nombre `${Date.now()}-${random}.${ext}`, devolver `{ success, url? , error? }`.
- [x] 3.6 `actions.ts`: helper `borrarImagenesDeStorage(urls)` replicando `deleteStorageFile` de `src/app/admin/circulares/actions.ts` — parsea la URL, corta por `/noticias-imagenes/`, ignora URLs externas y traga errores (best-effort).
- [x] 3.7 `actions.ts` → `crearNoticia`: parsear con Zod, reemplazar `prisma.noticia.create` por `NoticiaRepository.create`, leer `imagenes` del FormData y llamar a `replaceImagenes(nuevaId, imagenes)`. Mantener el slug, `publicada_en`, los `revalidatePath` y `updateTag("categorias-noticias")` actuales.
- [x] 3.8 `actions.ts` → `actualizarNoticia`: parsear con Zod, diff de URLs viejas (de `getById`) vs. nuevas → `borrarImagenesDeStorage(quitadas)` → `NoticiaRepository.update(...)` → `replaceImagenes(...)`. Preservar la lógica actual de `publicada_en`.
- [x] 3.9 `actions.ts` → `eliminarNoticia`: leer las URLs antes de borrar, usar `NoticiaRepository.delete(id)` (cascade limpia `NoticiaImagen`), luego `borrarImagenesDeStorage(...)`.
- [x] 3.10 Confirmar que las tres actions siguen devolviendo `{ success: boolean, error?: string }` y que no queda ningún `prisma.` importado en `actions.ts`.
- [x] 3.11 `prisma/backfill-noticia-imagenes.ts`: script one-off (ts-node) que, por cada `Noticia` con `imagen_url != null` y sin `NoticiaImagen`, crea una fila con `orden: 0`. Idempotente. Correrlo una vez.

## 4. Frontend Admin

- [x] 4.1 `src/app/admin/noticias/GaleriaImagenesInput.tsx` (nuevo, `"use client"`): estado local de la lista, `<input type="hidden" name="imagenes">` con el JSON `[{url, alt}]` (ítems en `subiendo`/`error` filtrados). Props: `name`, `defaultValue`.
- [x] 4.2 `GaleriaImagenesInput`: drop zone + file picker múltiple; subida **secuencial, un archivo por request** vía `subirImagenNoticia`; estado por ítem (`subiendo` con `Loader2` / `listo` con miniatura / `error` con mensaje) sin descartar los demás.
- [x] 4.3 `GaleriaImagenesInput`: reordenamiento con `Reorder.Group` / `Reorder.Item` de `framer-motion` **más** botones ←/→ como alternativa accesible/touch. Badge "Portada" sobre el ítem 0.
- [x] 4.4 `GaleriaImagenesInput`: input de `alt` por imagen (máx. 200) y botón de quitar (solo saca de la lista; el borrado en Storage ocurre al guardar).
- [x] 4.5 `GaleriaImagenesInput`: conservar un input "agregar por URL" para las imágenes externas (Unsplash) que ya se usan hoy.
- [x] 4.6 `GaleriaImagenesInput`: estilo reciclando las clases del bloque de imagen actual (`rounded-3xl`, `border-2 border-dashed border-slate-200`, `hover:border-blue-400`), grid `grid-cols-2 gap-3`, glassmorphism en los overlays, **sin px fijos**.
- [x] 4.7 `src/app/admin/noticias/nueva/NuevaNoticiaForm.tsx`: reemplazar el bloque "Imagen de Portada (URL)" (líneas ~168-193) por `<GaleriaImagenesInput name="imagenes" defaultValue={[]} />`; quitar `imagen_url` del `useState`.
- [x] 4.8 `src/app/admin/noticias/editar/[id]/EditarNoticiaForm.tsx`: mismo reemplazo con `defaultValue={noticia.imagenes}`; ampliar el tipo de la prop `noticia` para incluir `imagenes`; quitar `imagen_url` del `useState`.
- [x] 4.9 `src/app/admin/noticias/editar/[id]/page.tsx`: verificar que el `getById` ya trae `imagenes` y que el tipo pasado al form compila.
- [x] 4.10 Actualizar el tip del panel "Tips de Edición" para mencionar que la primera imagen es la portada de los listados.

## 5. Frontend Público

- [x] 5.1 `src/app/noticias/[slug]/CarruselNoticia.tsx` (nuevo, `"use client"`): props `{ imagenes, titulo }`. Rama 0 imágenes → placeholder actual (`aspect-video` + ícono `Newspaper`); 1 imagen → `<Image fill priority>` sin controles; ≥2 → carrusel.
- [x] 5.2 `CarruselNoticia`: `AnimatePresence` con `mode="wait"`, transición slide + fade en `x`/`opacity`.
- [x] 5.3 `CarruselNoticia`: flechas prev/next glassmorphism (`backdrop-blur-md bg-white/70 hover:bg-white shadow-lg`, `left-4`/`right-4`) con `aria-label`, deshabilitadas en los extremos (**sin loop**).
- [x] 5.4 `CarruselNoticia`: indicadores de puntos clickeables (el activo más ancho) + píldora glass con el contador `2 / 5`.
- [x] 5.5 `CarruselNoticia`: teclado (`tabIndex={0}` + `ArrowLeft`/`ArrowRight`) y swipe touch (`drag="x"` con `dragConstraints` y umbral de velocidad). **Sin autoplay.**
- [x] 5.6 `CarruselNoticia`: `priority` solo en el índice 0; el resto con carga diferida. `alt` = `imagen.alt || titulo`.
- [x] 5.7 `src/app/noticias/[slug]/page.tsx`: reemplazar el bloque hero (líneas ~65-78) por `<CarruselNoticia imagenes={noticia.imagenes} titulo={noticia.titulo} />`. La página **sigue siendo Server Component**.
- [x] 5.8 `page.tsx`: verificar que `generateMetadata` sigue usando `imagen_url` para el OG y que el sidebar de relacionadas sigue usando `n.imagen_url` — **sin cambios en ninguno de los dos**.

## 6. Verificación

- [x] 6.1 Tests unit (Vitest): derivación de `imagen_url` (galería con N → `imagenes[0].url`; vacía → `null`) y renumeración de `orden` 0..N-1.
- [x] 6.2 Tests unit: `imagenesNoticiaSchema` (URL inválida, 11 ítems, `alt` de 201 caracteres).
- [x] 6.3 Tests unit: `borrarImagenesDeStorage` con URL externa → no llama a `remove`; con URL del bucket → extrae bien el path.
- [x] 6.4 `npx vitest run` en verde y `npx tsc --noEmit` sin errores.
- [ ] 6.5 Manual admin: crear noticia con 3 imágenes, reordenar, borrar una, guardar → el orden y el borrado persisten; el archivo quitado ya no está en el bucket. **(QA manual pendiente post-deploy — usuario validará en producción/dev con sesión propia)**
- [ ] 6.6 Manual admin: subir un archivo no-imagen y uno de más de 4 MB → error legible por ítem, el resto de la galería intacta. **(QA manual pendiente post-deploy — usuario validará en producción/dev con sesión propia)**
- [ ] 6.7 Manual público: `/noticias/[slug]` con ≥2 imágenes → carrusel con flechas, puntos, teclado y swipe; con 1 → imagen estática; con 0 → placeholder. **(QA manual pendiente post-deploy — usuario validará en producción/dev con sesión propia)**
- [ ] 6.8 Manual: tras el backfill, una noticia vieja sigue mostrando su imagen y aparece igual en `/`, `/noticias` y `/admin/noticias`. **(QA manual pendiente post-deploy — usuario validará en producción/dev con sesión propia)**
- [x] 6.9 Verificado por SQL directo (`SELECT relrowsecurity FROM pg_class WHERE relname = 'NoticiaImagen'` → `true`), no por la UI de Supabase, pero con la misma garantía.
- [x] 6.10 Sin `console.log` residuales en código de app/runtime (los `console.log` de `prisma/backfill-noticia-imagenes.ts` son output de un script CLI one-off, mismo patrón que `prisma/seed.ts`).

## 7. Cierre

- [x] 7.1 Sync de specs en archive: `openspec/specs/admin-noticias-crud/spec.md`, `openspec/specs/noticias-frontend/spec.md` y alta de `openspec/specs/noticias-galeria-imagenes/spec.md`.
- [x] 7.2 Marcar todas las tareas como `[x]` antes de `opsx:archive` (notas: 6.5-6.8 quedan como QA manual pendiente post-deploy, no como bloqueo).
- [ ] 7.3 Commit (`feat: carrusel de imágenes de portada en noticias`) y push.
