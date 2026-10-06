## Context

Ver proposal.md (Why). Estado actual relevante:

- `src/app/admin/beneficios/actions.ts`: `crearBeneficio` / `actualizarBeneficio` / `eliminarBeneficio` leen el `FormData` con casts, sin Zod, y usan `prisma` directo. `editar/[id]/page.tsx` también usa `prisma` directo.
- Los forms (`nuevo/page.tsx`, `EditBeneficioForm.tsx`) son client components que arman `FormData` desde el `<form>` y llaman a la action. Hoy tienen un `<input name="logo_url">` de texto (en edición es `required`).
- Patrones existentes a reutilizar:
  - `src/lib/storage/noticias.ts`: `extraerPathDelBucket` + borrado best-effort.
  - `src/app/admin/noticias/actions.ts` (`subirImagenNoticia`): subida con `supabaseAdmin`, path `${Date.now()}-${rand}.${ext}`, `getPublicUrl`.
  - `src/lib/validations/noticia.ts`: constantes `ALLOWED_IMAGE_MIME_TYPES` / `MAX_IMAGE_SIZE_BYTES`.
  - `src/lib/validations/archivoCliente.ts`: tipo `ArchivoLike` para validar archivos sin DOM.
  - `scripts/setup-bolsa-trabajo.ts`: setup idempotente de bucket con verificación real.
  - `src/app/admin/_components/SafeLogoImage.tsx`: `<img>` con fallback en `onError`.
- `serverActions.bodySizeLimit` es `"6mb"`.

## Goals / Non-Goals

**Goals:**
- Logo en Storage propio como camino principal; URLs externas permitidas pero desaconsejadas en la UI.
- Cero archivos huérfanos en el camino feliz y limpieza best-effort en los de error.
- Nunca una imagen rota en páginas públicas.

**Non-Goals:**
- Recorte/redimensionado de la imagen (se muestra con `object-contain`).
- Reordenar o rediseñar los formularios más allá del bloque del logo.
- Migrar a `next/image` (sigue `<img>` como hoy).
- Unificar los forms de alta y edición en uno solo.

## Decisions

### 1. Archivo (principal) o URL pegada (alternativa)
**Elegido (decisión de la usuaria):** el form ofrece subir archivo como opción principal y un campo opcional "o pegá una URL". Si llegan ambos, gana el archivo. La URL se valida con Zod, sólo `https`. Debajo del campo, aviso fijo y genérico: "Los links externos pueden dejar de funcionar (los de Instagram, Facebook o WhatsApp vencen en días). Recomendamos subir el archivo." No se bloquea ningún dominio.
**Por qué:** algunos admins sólo tienen el link (sitio de la empresa); el aviso empuja a subir el archivo sin quitarles la opción. El fallback visual (decisión 7) cubre los links que igual venzan.
**Alternativas descartadas:** (a) sólo archivo → más rígido para el admin; (b) bloquear dominios `cdninstagram`/`fbcdn` → lista incompleta y frágil; (c) que el servidor descargue la URL y la re-suba → riesgo de SSRF y más código.

### 2. Subida dentro de la misma action que guarda (no action separada)
**Elegido:** el `<input type="file" name="logo">` viaja en el mismo `FormData` a `crearBeneficio` / `actualizarBeneficio`. La action valida, sube, escribe en base y, si la base falla, borra lo recién subido.
**Por qué:** un solo request, sin archivos huérfanos cuando el admin elige un logo y cancela (problema que sí tiene el flujo de noticias, donde la subida es inmediata). Un logo es un único archivo de ≤ 2 MB: entra holgado en los 6 MB del body.
**Alternativa:** replicar `subirImagenNoticia` (subida inmediata con su propia action) → necesaria en noticias por la galería múltiple con progreso por ítem; acá no aporta nada y deja huérfanos.
**Vista previa:** `URL.createObjectURL(file)` en el cliente (revocar al cambiar/desmontar).

### 3. Contrato del form para el logo
Campos que llegan a la action:
- `logo` (File, opcional): archivo nuevo.
- `logo_url_externa` (string, opcional): URL pegada. Vacío = "no cambiar". En edición el campo arranca vacío (el logo actual se muestra en la vista previa, no se precarga en el input).
- `quitar_logo` (`"on"` o ausente): sólo en edición.
- El `logo_url` actual **no** viaja desde el cliente: la action lo lee de la base (`BeneficioRepository.getById`). Así el cliente no puede inyectar una URL arbitraria.

Decisión pura y testeable en `src/lib/storage/beneficios.ts`:
```ts
resolverCambioLogo({ actual, subida, urlPegada, quitar }):
  { logo_url: string | null; aBorrar: string | null }
```
Prioridad (primera que aplica):
- `subida` presente → `{ logo_url: subida, aBorrar: actual }`
- `quitar` → `{ logo_url: null, aBorrar: actual }`
- `urlPegada` presente y distinta de `actual` → `{ logo_url: urlPegada, aBorrar: actual }`
- nada → `{ logo_url: actual, aBorrar: null }`

`actual` siempre sale de la base. Si `subida` existe, la action ni siquiera valida `urlPegada` (el archivo gana).

`aBorrar` se pasa a `borrarLogoDeStorage`, que ignora URLs que no sean del bucket (legacy de Instagram).

### 4. Storage: helper compartido de path
`extraerPathDelBucket(url)` de `noticias.ts` tiene el bucket hardcodeado. Se mueve a `src/lib/storage/bucketPath.ts` como `extraerPathDelBucket(url, bucket)`; `noticias.ts` lo reutiliza (sus tests siguen pasando) y `beneficios.ts` también. Una sola implementación del parseo.

`src/lib/storage/beneficios.ts` expone:
- `BUCKET_BENEFICIOS_LOGOS = "beneficios-logos"`
- `subirLogoBeneficio(file): Promise<string>` (lanza si falla; la action lo captura)
- `borrarLogoDeStorage(url | null): Promise<void>` (best-effort, traga errores)
- `resolverCambioLogo(...)` (pura)

### 5. Validación
`src/lib/validations/beneficio.ts`:
- `beneficioSchema` (Zod): `empresa`, `descripcion`, `descuento` min 1; `categoriaId` min 1; `enlace` `z.url()` o `""` → `null`; `logo_url_externa` `z.url({ protocol: /^https$/ })` o `""` → `null` (verificar la opción de protocolo en la versión de Zod instalada; si no existe, `.refine(u => u.startsWith("https://"))`).
- `ALLOWED_LOGO_MIME_TYPES = ["image/png","image/jpeg","image/webp","image/avif"]`, `MAX_LOGO_SIZE_BYTES = 2 MB`.
- `validarLogo(file: ArchivoLike): string | null` — pura, la usan el form (al elegir archivo) y la action (antes de subir).
**SVG excluido:** un SVG en bucket público se sirve como documento y puede ejecutar scripts (XSS sobre el dominio de Storage).

Orden en la action: `requireAdmin` → Zod → `validarLogo` (si hay archivo) → (edición: leer actual de la base) → subir (si hay archivo) → `resolverCambioLogo` → escribir en base → `borrarLogoDeStorage(aBorrar)` (ignora URLs externas, como `noticias.ts`) → `revalidatePath` (`/admin/beneficios`, `/kineclub`, `/`).

### 6. Repository
`BeneficioRepository` gana `getById`, `create`, `update`, `delete`. Las actions y `editar/[id]/page.tsx` dejan de importar `prisma`. Se elimina el `as any` del page tipando el prop con el tipo del modelo.

### 7. Fallback visual público
`SafeLogoImage` se mueve a `src/components/atoms/SafeLogoImage.tsx` (lo usan admin y público; `admin/_components` no es lugar para algo público). Se usa en `src/app/page.tsx` (Server Component: el átomo ya es client, se importa directo) y `KineClubClient.tsx`, pasando el `fallback` que cada uno ya renderiza cuando no hay logo (`Award` / `ShoppingBag`). Se actualiza el import en `admin/beneficios/page.tsx`.

### 8. Bucket e infraestructura
`scripts/setup-beneficios-logos.ts`, calcado de `setup-bolsa-trabajo.ts` sin la parte de RLS (no hay tablas nuevas): `createBucket("beneficios-logos", { public: true, fileSizeLimit: 2 MB, allowedMimeTypes: [...] })` si no existe; sube un PNG de prueba, verifica que la URL pública responda 200, y lo borra. Lo corre la usuaria con `npx tsx scripts/setup-beneficios-logos.ts`. **Un agente nunca lo ejecuta.**
No hacen falta políticas de Storage: la escritura es con service role (`supabaseAdmin`), la lectura es pública por el flag del bucket.

### 9. Migración de logos existentes (opcional, manual)
`scripts/migrar-logos-beneficios.ts`: recorre beneficios con `logo_url` que no sea del bucket; `fetch` con timeout; si responde 200 con `content-type` permitido y ≤ 2 MB, sube y actualiza `logo_url`; si no, lo reporta como "a cargar a mano". Simulación por defecto, `--aplicar` para escribir. Corre con Prisma y cliente Supabase propios (como el script de setup), no importa código de `src/`.

## Prisma

Sin cambios de schema. `BeneficioKineClub.logo_url String?` se mantiene.

## UI (Atomic Design)

- **Átomo** `SafeLogoImage` (movido).
- **Molécula** `LogoBeneficioInput` (nuevo, `src/app/admin/beneficios/LogoBeneficioInput.tsx`, client): drop zone/click con `<input type="file" name="logo" accept=...>`; debajo, input `type="url" name="logo_url_externa"` ("o pegá una URL") con el aviso genérico en texto chico; vista previa (archivo elegido → object URL; si no, URL pegada; si no, logo actual, todo vía `SafeLogoImage`); mensaje de error de `validarLogo`; en edición checkbox/botón "Quitar logo" que emite `quitar_logo`. Estilo calcado de la drop zone de `GaleriaImagenesInput`. Sólo rem/escala Tailwind.
- Los dos forms reemplazan su bloque de logo por la molécula (en edición se quita el `required` actual del campo URL). Se elimina el estado `logoUrl` de ambos.

## Risks / Trade-offs

- [El bucket no existe al desplegar] → las subidas fallan con error claro (`{ success: false }`). Mitigación: tarea explícita "correr setup antes del deploy" y la action devuelve un mensaje legible.
- [Archivo subido y luego falla la base] → se borra best-effort; si también falla el borrado queda un huérfano. Aceptable (volumen bajo).
- [Falla el borrado del logo viejo] → huérfano en el bucket; no afecta lo visible.
- [Un admin ignora el aviso y pega un link de Instagram] → el logo vuelve a vencer. Mitigación: aviso visible, fallback visual en público, y el script de migración se puede re-correr.
- [Beneficios legacy con URL de Instagram] → siguen venciéndose hasta que se migren o se edite el logo; mientras tanto el fallback evita la imagen rota.
- [Server action con archivo + `router.push`] → el form ya maneja `isPending`; un archivo de 2 MB no cambia el patrón.

## Migration Plan

1. Usuaria corre `npx tsx scripts/setup-beneficios-logos.ts` (prod) y confirma "bucket público ✓".
2. Deploy del código.
3. Opcional: `npx tsx scripts/migrar-logos-beneficios.ts` (simulación), revisar, luego `--aplicar`. Los vencidos se cargan a mano desde el admin.
4. Rollback: revertir el deploy. Los `logo_url` del bucket siguen siendo URLs públicas válidas, así que el código viejo los muestra sin problema.
