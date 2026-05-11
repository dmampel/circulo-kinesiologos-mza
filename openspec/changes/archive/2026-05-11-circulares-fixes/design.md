# Design: circulares-fixes

## Architecture Decisions

### Zod + Error Handling en Server Actions
Se agrega un schema Zod para validar los campos de texto del formulario. El patrón es:
1. `safeParse` al inicio de create/update
2. Si falla: `throw new Error(message)` — Next.js lo captura en el error boundary
3. Storage operations en try/catch — si falla, `throw new Error` descriptivo
4. `redirect()` va fuera del try/catch para que Next.js lo maneje correctamente (es un throw interno)

No se convierte a Client Components. El admin es una herramienta interna donde el error boundary de Next.js es aceptable para errores de validación.

Schema Zod:
```typescript
const circularSchema = z.object({
  titulo: z.string().min(1, "El título es requerido").max(200),
  etiqueta: z.string().min(1, "La etiqueta es requerida").max(50),
  contenido: z.string().max(5000).optional().nullable(),
  archivo_url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  publicada: z.boolean(),
});
```

### Storage Cleanup
La URL pública de Supabase Storage tiene formato:
`https://{project}.supabase.co/storage/v1/object/public/circulares-adjuntos/{filename}`

Para extraer el path del archivo: usar `URL.pathname` y extraer todo después de `/circulares-adjuntos/`.

Función helper privada `deleteStorageFile(url: string)`: solo borra si la URL contiene `circulares-adjuntos` (discrimina URLs externas).

En `updateCircular`: si se sube un nuevo archivo Y el `archivo_url` actual contiene el bucket propio → borrar el anterior antes de subir el nuevo.
En `deleteCircular`: cargar la circular, si tiene `archivo_url` propia → borrar de storage antes de borrar el registro.

### Páginas del Socio

**`/mi-panel/circulares/[id]`** — Server Component:
- Llama `CircularRepository.getPublishedById(id)` — si no existe o es borrador → `notFound()`
- Muestra: título, etiqueta, fecha, contenido (si existe), botón "Descargar / Ver archivo" (si tiene archivo_url)
- Diseño consistente con el resto del portal (rounded-2xl, tipografía editorial)

**`/mi-panel/circulares`** — Server Component:
- Llama `CircularRepository.getAllPublished()`
- Vista de lista completa estilo agenda (igual que el dashboard pero sin límite)

### Link en mi-panel
El link del título de cada circular en mi-panel/page.tsx pasa de apuntar a `archivo_url || "#"` a apuntar a `/mi-panel/circulares/{id}`. El detalle interno mostrará el archivo como botón si existe.

### CircularRepository additions
```typescript
static async getPublishedById(id: string)  // where: { id, publicada: true }
static async getAllPublished()              // where: { publicada: true }, orderBy: publicada_en desc
```

## Files Changed
| File | Action |
|------|--------|
| `src/lib/repositories/CircularRepository.ts` | ADD `getPublishedById`, `getAllPublished` |
| `src/app/admin/circulares/actions.ts` | ADD Zod, error handling, storage cleanup |
| `src/app/admin/circulares/page.tsx` | REMOVE fake search input |
| `src/app/mi-panel/page.tsx` | FIX links + "Ver historial" link |
| `src/app/mi-panel/circulares/[id]/page.tsx` | CREATE detail page |
| `src/app/mi-panel/circulares/page.tsx` | CREATE historial page |
