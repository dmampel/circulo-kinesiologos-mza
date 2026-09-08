# Design: Múltiples imágenes de portada (carrusel) en Noticias

Tres piezas: una tabla relacionada nueva, un uploader real (que hoy **no existe** para noticias)
y un carrusel en el detalle público. `Noticia.imagen_url` sobrevive como cache derivado para que
los listados, el sitemap y el Open Graph no se toquen.

## 0. Estado actual (verificado en el código)

| Hecho | Dónde |
|---|---|
| `imagen_url` es un `<input type="url">` que el admin pega a mano — **no hay upload de archivos** | `NuevaNoticiaForm.tsx:174`, `EditarNoticiaForm.tsx:172` |
| `crearNoticia` y `eliminarNoticia` usan `prisma` directo (violan el pilar 1 de `AGENTS.md`) | `actions.ts:29`, `actions.ts:103` |
| No hay Zod en las actions de noticias (sí lo hay en circulares y sorteos) | `actions.ts` |
| El patrón de upload del repo es server-side con `supabaseAdmin` + `getPublicUrl` | `admin/circulares/actions.ts:23-51`, `mi-panel/perfil/actions.ts:119-133` |
| `imagen_url` se lee en 4 superficies además del detalle | `app/page.tsx`, `noticias/page.tsx`, `admin/noticias/page.tsx`, OG del detalle |
| `images.remotePatterns` ya acepta cualquier host https | `next.config.ts:21-25` |
| Server Actions limitadas a 4 MB de body | `next.config.ts:16-20` |

## 1. Prisma / DB

```prisma
model Noticia {
  // ...
  imagen_url   String?          // cache derivado: imagenes[0].url
  imagenes     NoticiaImagen[]
  // ...
}

model NoticiaImagen {
  id        String   @id @default(cuid())
  noticiaId String
  noticia   Noticia  @relation(fields: [noticiaId], references: [id], onDelete: Cascade)
  url       String
  alt       String?
  orden     Int      @default(0)
  createdAt DateTime @default(now())

  @@index([noticiaId, orden])
}
```

Decisiones:

- **Tabla relacionada, no `String[]`** (decidido con la usuaria). `String[]` no deja guardar `alt`
  ni metadata futura, y cualquier campo extra obliga a rehacer la columna.
- **Sin `@@unique([noticiaId, orden])`**: el reordenamiento haría chocar el índice durante los
  swaps. El orden se garantiza por construcción (renumeración 0..N-1 en cada guardado) y por
  `orderBy` en lectura. El `@@index` es solo para performance de la lectura ordenada.
- **`onDelete: Cascade`**: borrar la noticia limpia sus filas sin código extra.
- **`imagen_url` se conserva**. Es la palanca que hace este cambio barato: `/`, `/noticias`,
  `/admin/noticias` y el OG no se tocan. Contrapartida: es un dato denormalizado que puede
  driftear — se mitiga con un único punto de escritura (§4).
- Migración: `npx prisma db push` + `npx prisma generate` (convención del repo).
- **RLS**: `ALTER TABLE "NoticiaImagen" ENABLE ROW LEVEL SECURITY;` en el SQL Editor. Es tabla
  **nueva**, así que es obligatorio (pilar 5 de `AGENTS.md`). Sin políticas: Prisma entra con
  `service_role` y bypasea RLS; la clave `anon` queda denegada por default, que es justo lo que
  se busca.

## 2. Supabase Storage

Bucket nuevo **`noticias-imagenes`**, **público** (mismo criterio que `profesionales-fotos`: son
imágenes de contenido público; `circulares-adjuntos` es privado porque son documentos internos).

- Escritura: solo server-side con `supabaseAdmin` (`service_role`), detrás de `requireAdmin()`.
  No hacen falta políticas de INSERT para `anon`.
- Lectura: pública vía `getPublicUrl`.
- Nombre de archivo: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}` — mismo
  patrón que circulares, evita colisiones y no filtra el nombre original.
- No se usa carpeta por noticia: en el alta la noticia todavía no tiene `id` cuando se sube la
  primera imagen. El borrado se resuelve por URL, no por prefijo.

## 3. Upload: una imagen por request

Server Action dedicada, **no** un upload masivo en el submit:

```ts
// src/app/admin/noticias/actions.ts
export async function subirImagenNoticia(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }>
```

Por qué de a una:
1. `serverActions.bodySizeLimit` es **4 MB**; mandar 6 fotos juntas en el submit lo revienta.
2. Preview inmediato → UX premium, el admin ve la miniatura mientras sigue escribiendo.
3. Un archivo que falla no arrastra a los demás.

Validación en la action, antes de tocar Storage: `requireAdmin()`, tipo en
`["image/jpeg","image/png","image/webp","image/avif"]`, tamaño ≤ 4 MB. Devuelve
`{ success, url? , error? }` — el contrato de `AGENTS.md`.

**Tradeoff aceptado**: si el admin sube fotos y abandona el formulario, quedan objetos huérfanos
en el bucket. Un janitor queda fuera de alcance; el caso común (quitar una imagen y guardar) sí
se limpia (§4).

## 4. Backend: repository + actions

### Payload del formulario

El form manda un campo único `imagenes` con JSON:

```jsonc
[{ "url": "https://…", "alt": "Apertura de la jornada" }]
```

El `orden` **no viaja**: se deriva del índice del array. Menos estado que sincronizar.

```ts
const imagenNoticiaSchema = z.object({
  url: z.url("URL de imagen inválida"),
  alt: z.string().max(200).optional().nullable(),
});
const imagenesNoticiaSchema = z.array(imagenNoticiaSchema).max(10, "Máximo 10 imágenes");
```

El cap de 10 es una decisión de producto (evita galerías inmanejables y páginas pesadas); es un
número, no una restricción técnica.

### `NoticiaRepository`

```ts
static async create(data: Prisma.NoticiaCreateInput)
static async delete(id: string)
static async getById(id)   // + include: { imagenes: { orderBy: { orden: "asc" } } }
static async getBySlug(slug) // idem
static async replaceImagenes(noticiaId: string, imagenes: { url: string; alt?: string | null }[])
```

- `replaceImagenes` corre en `prisma.$transaction([deleteMany, createMany, update])`:
  borra las filas viejas, crea las nuevas con `orden: i`, y actualiza
  `imagen_url = imagenes[0]?.url ?? null`. **Ese es el único lugar del código que escribe
  `imagen_url`** — es lo que evita el drift del cache derivado.
- Reemplazo total en vez de diff fila por fila: los `id` de `NoticiaImagen` no son visibles ni
  referenciados por nadie, así que el diff no compra nada y sí agrega complejidad.
- `getPaginated`, `getUltimas`, `getLatest`, `getRelated`: **sin cambios**. No incluyen `imagenes`
  — los listados leen `imagen_url` y traer la galería sería overfetch puro.

### Actions

- `crearNoticia`: Zod → `NoticiaRepository.create(...)` (adiós `prisma.noticia.create`) →
  `replaceImagenes(nuevaId, imagenes)`.
- `actualizarNoticia`: Zod → `NoticiaRepository.update(...)` → diff de URLs viejas vs. nuevas →
  `borrarImagenesDeStorage(urlsQuitadas)` (best-effort, solo las del bucket propio; las externas
  se ignoran) → `replaceImagenes(...)`.
- `eliminarNoticia`: leer las URLs primero → `NoticiaRepository.delete(id)` (cascade limpia la
  tabla) → borrar los objetos del bucket, best-effort.
- Se mantienen `revalidatePath("/admin/noticias" | "/noticias" | "/")` y
  `updateTag("categorias-noticias")` tal como están hoy.
- El helper de borrado en Storage replica `deleteStorageFile` de `admin/circulares/actions.ts`:
  parsea la URL, corta por `/noticias-imagenes/`, y traga los errores.

## 5. UI Admin — `GaleriaImagenesInput`

`src/app/admin/noticias/GaleriaImagenesInput.tsx` — **`"use client"`** (drag, upload y estado
local: interactividad genuina, no es un `"use client"` de conveniencia).

```
<GaleriaImagenesInput name="imagenes" defaultValue={noticia?.imagenes ?? []} />
```

Un solo componente para los dos forms; `NuevaNoticiaForm` lo monta con `[]`.

Estructura (Atomic Design):

```
GaleriaImagenesInput        (organismo: estado, orden, hidden input con el JSON)
├── DropZoneImagenes        (molécula: drag&drop + file picker múltiple)
└── ImagenGaleriaItem       (molécula: miniatura, alt, mover, borrar, estado de subida)
    └── BadgePortada        (átomo: se muestra solo en el índice 0)
```

Comportamiento:

- **Reordenamiento**: `Reorder.Group` / `Reorder.Item` de `framer-motion` (ya instalado, ^12.38.0)
  para arrastrar, **más** botones ←/→ como alternativa accesible y usable en touch. Solo drag
  sería una trampa de accesibilidad.
- **Subida**: los archivos se procesan en secuencia; cada ítem entra con estado `subiendo`
  (skeleton + `Loader2` girando) y pasa a `listo` con la URL, o a `error` con el mensaje.
- **Agregar por URL**: se conserva un input de URL para no romper el flujo actual (las noticias
  existentes usan URLs externas tipo Unsplash). Empuja un ítem más a la lista.
- **Alt**: input chico bajo cada miniatura.
- **Portada**: badge sobre el ítem 0 con el texto "Portada" + la aclaración de que es la imagen
  que se ve en los listados y al compartir.
- **Salida**: `<input type="hidden" name="imagenes" value={JSON.stringify(items)} />`, con los
  ítems en estado `error`/`subiendo` filtrados.

Estilo: se reciclan las clases del bloque de imagen actual (`rounded-3xl`, `border-2
border-dashed border-slate-200`, `hover:border-blue-400`). Grid `grid-cols-2 gap-3`, sin px fijos.
El campo "Imagen de Portada (URL)" desaparece de ambos forms.

## 6. UI Pública — `CarruselNoticia`

`src/app/noticias/[slug]/CarruselNoticia.tsx` — **`"use client"`**. `page.tsx` sigue siendo
Server Component y solo le pasa datos ya resueltos:

```tsx
<CarruselNoticia imagenes={noticia.imagenes} titulo={noticia.titulo} />
```

Tres ramas, decididas dentro del componente:

| Imágenes | Render |
|---|---|
| 0 | Placeholder actual: `aspect-video bg-slate-100` + ícono `Newspaper` |
| 1 | `<Image fill className="object-cover" priority />` — idéntico a hoy, sin controles |
| ≥2 | Carrusel |

Carrusel:
- Contenedor `relative aspect-video overflow-hidden bg-slate-100`, misma caja que la imagen hero
  actual → el layout de la página no se mueve.
- `AnimatePresence` con `mode="wait"` y transición de slide + fade (`x` + `opacity`), duración
  corta. Micro-animación, no espectáculo.
- Flechas prev/next: círculos `backdrop-blur-md bg-white/70 hover:bg-white shadow-lg`,
  posicionadas `left-4` / `right-4`, `aria-label="Imagen anterior" / "Imagen siguiente"`.
  Glassmorphism, según el pilar de UI.
- Indicadores: puntos abajo al centro, el activo más ancho; clickeables.
- Contador `2 / 5` en una píldora glass arriba a la derecha.
- **Sin autoplay**: son fotos de nota periodística, se miran a ritmo del lector; además el
  autoplay pelea con el scroll de lectura.
- **Sin loop infinito** en la primera versión: en los extremos las flechas se deshabilitan. Es
  más predecible y evita el salto visual del wrap-around.
- Teclado: `ArrowLeft` / `ArrowRight` cuando el carrusel tiene foco (`tabIndex={0}` + `onKeyDown`).
- Touch: `drag="x"` de framer-motion con `dragConstraints` y umbral de velocidad para pasar slide.
- Performance: `priority` solo en el índice 0 (es el LCP de la página); el resto queda con la
  carga diferida por defecto de `next/image`.
- `alt`: `imagen.alt || titulo`.

## 7. Backfill

`prisma/backfill-noticia-imagenes.ts`, corrido con `ts-node` (mismo runner que `prisma/seed.ts`):

```
para cada Noticia con imagen_url != null y _count.imagenes === 0
  → crear NoticiaImagen { url: imagen_url, orden: 0 }
```

Idempotente por la condición de conteo, y no destructivo: solo inserta. `imagen_url` queda como
está, así que si se revierte el cambio el sitio sigue funcionando exactamente igual que antes.

## 8. Verificación

`strict_tdd: false`, pero el proyecto **sí** tiene Vitest (`npx vitest run`). Cobertura prevista:

- Unit: derivación de `imagen_url` (galería con N ítems → `imagenes[0].url`; galería vacía →
  `null`) y renumeración de `orden`.
- Unit: schema Zod (URL inválida, 11 ítems, `alt` de 201 caracteres).
- Unit: parseo de URL del bucket en el helper de borrado (URL externa → no intenta borrar).
- Manual (no cubierto por tests): drag&drop, subida real a Storage, carrusel en móvil, RLS.

Cierre: `npx tsc --noEmit` limpio y sin `console.log` residuales.
