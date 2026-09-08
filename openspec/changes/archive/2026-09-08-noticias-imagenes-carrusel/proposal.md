# Proposal: Múltiples imágenes de portada (carrusel) en Noticias

## Intent

Hoy una noticia tiene **una sola** imagen de portada: `Noticia.imagen_url String?`, cargada pegando una URL a mano en el admin (no hay upload de archivos para noticias). Las notas con cobertura fotográfica —jornadas, actos, congresos— no tienen dónde poner el resto de las fotos.

Se pide soportar **N imágenes de portada ordenadas**, subibles desde el admin y mostradas como carrusel en el detalle público.

## Scope

### In Scope
- Modelo **`NoticiaImagen`** (tabla relacionada 1-N con `orden` y `alt`) + `prisma db push` + **RLS habilitado** (AGENTS.md).
- Bucket público nuevo de Supabase Storage **`noticias-imagenes`** + **upload real de archivos** (hoy no existe para noticias) siguiendo el patrón de `src/app/admin/circulares/actions.ts` (`supabaseAdmin` server-side).
- `NoticiaRepository`: `create`, `delete`, `include` de `imagenes` en `getById`/`getBySlug`, y reconciliación de la galería. Se elimina el bypass de Prisma que hoy tiene `actions.ts`.
- Server Actions `crearNoticia` / `actualizarNoticia` / `eliminarNoticia` + action nueva `subirImagenNoticia`, todas con Zod y contrato `{ success, error? }`.
- Componente admin de galería (subir / reordenar / borrar / alt) compartido por `NuevaNoticiaForm` y `EditarNoticiaForm`.
- Carrusel en `/noticias/[slug]` (framer-motion, glassmorphism, sin px fijos).
- Backfill: cada noticia con `imagen_url` pasa a tener su `NoticiaImagen` con `orden = 0`.

### Out of Scope
- Cambiar los **listados** (`/`, `/noticias`, `/admin/noticias`) y el OG image: siguen leyendo `imagen_url`, que pasa a ser cache derivado de la primera imagen.
- Galería embebida dentro del Markdown del contenido.
- Recorte/optimización de imágenes en el cliente, lightbox a pantalla completa, autoplay.
- Migrar `Sorteo.imagen_url` u otras entidades al mismo esquema.
- Janitor de archivos huérfanos en el bucket.

## Capabilities

### New Capabilities
- `noticias-galeria-imagenes`: modelo de datos, RLS, upload a Storage, orden, alt y derivación de `imagen_url`.

### Modified Capabilities
- `admin-noticias-crud`: la noticia se edita con una galería de N imágenes (subir/reordenar/borrar) en vez de un único campo URL.
- `noticias-frontend`: la portada del detalle es un carrusel cuando hay más de una imagen.

## Approach

Tabla relacionada (no `String[]`): permite `orden` explícito, `alt` por imagen y metadata futura sin migración destructiva. `Noticia.imagen_url` **se conserva** como cache derivado (`imagenes[0].url`) escrito solo por las Server Actions: cero cambios en listados, sitemap y SEO, y rollback trivial.

Upload de a **una imagen por request** vía Server Action (`next.config.ts` limita Server Actions a 4 MB), devolviendo la URL pública para preview inmediato. Al guardar, se reconcilia la galería en una transacción y se borran del bucket las imágenes quitadas.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | New/Modified | modelo `NoticiaImagen` + relación `Noticia.imagenes` |
| Supabase Storage | New | bucket público `noticias-imagenes` |
| Supabase SQL | New | `ALTER TABLE "NoticiaImagen" ENABLE ROW LEVEL SECURITY;` |
| `src/lib/repositories/NoticiaRepository.ts` | Modified | `create`, `delete`, `include: imagenes`, reconciliación |
| `src/app/admin/noticias/actions.ts` | Modified | Zod + galería + `subirImagenNoticia` + limpieza de Storage |
| `src/app/admin/noticias/GaleriaImagenesInput.tsx` | New | uploader/reorder/delete (client) |
| `.../nueva/NuevaNoticiaForm.tsx`, `.../editar/[id]/EditarNoticiaForm.tsx` | Modified | reemplazan el input único por la galería |
| `src/app/noticias/[slug]/CarruselNoticia.tsx` | New | carrusel (client) |
| `src/app/noticias/[slug]/page.tsx` | Modified | usa el carrusel en vez de `<Image>` suelto |
| `prisma/backfill-noticia-imagenes.ts` | New | script one-off de backfill |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Olvidar el RLS de la tabla nueva | Media | Tarea explícita y bloqueante en el grupo 2 |
| `imagen_url` derivado se desincroniza | Media | Se escribe en un solo lugar: la reconciliación del repository |
| Archivos huérfanos si se abandona el form | Media | Diff en el guardado borra las quitadas; el abandono se acepta y se documenta |
| Carrusel pesado degrada el LCP | Media | Solo la primera imagen con `priority`; el resto `loading="lazy"` |
| Regresión en listados/OG | Baja | `imagen_url` no cambia de tipo ni de semántica de lectura |

## Rollback Plan

1. `git revert` del commit → vuelve el input único; `imagen_url` sigue poblado (el backfill no lo borra) y todo el sitio renderiza como antes.
2. La tabla `NoticiaImagen` puede quedar en la DB, inerte. Si se quiere limpiar: quitar el modelo + `prisma db push`.
3. El bucket `noticias-imagenes` se conserva; las URLs públicas ya guardadas en `imagen_url` siguen resolviendo.
4. Cero data destruida: el backfill solo **agrega** filas.

## Dependencies

- Acceso al proyecto de Supabase para crear el bucket, correr el `db push` y el `ENABLE ROW LEVEL SECURITY`.
- `framer-motion` (ya instalado, ^12.38.0). No se agregan librerías de carrusel.

## Success Criteria

- [ ] La admin sube varias imágenes a una noticia, las reordena, borra una y guarda; el orden persiste.
- [ ] `/noticias/[slug]` muestra carrusel con ≥2 imágenes, imagen estática con 1 y el placeholder actual con 0.
- [ ] Las noticias viejas siguen mostrando su imagen (backfill) y los listados no cambian.
- [ ] `NoticiaImagen` tiene RLS habilitado en Supabase.
- [ ] Ningún acceso a `prisma.noticia` fuera de `NoticiaRepository`.
- [ ] `npx tsc --noEmit` y `npx vitest run` en verde.
