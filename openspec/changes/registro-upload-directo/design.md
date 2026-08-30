# Design: registro-upload-directo

## Technical Approach

Sacamos los bytes del camino crítico de Vercel. Hoy los 8 documentos viajan dentro del body de la Server Action `crearSolicitud` y mueren contra el techo de ~4.5 MB de las Serverless Functions. La solución es invertir la responsabilidad: **el servidor emite permisos, el navegador transfiere bytes.**

El servidor sigue siendo la única autoridad sobre *dónde* se escribe (elige el path de cada objeto), *qué* se acepta (valida el manifiesto: claves, tamaños, MIME) y *cuándo* se persiste (verifica contra Storage antes de crear la `Solicitud`). Lo único que delega al navegador es el transporte del archivo, contra una URL firmada de un solo uso atada a un path concreto.

El resultado es que el body de toda Server Action del flujo de registro pasa a ser JSON de unos pocos KB, y el límite de plataforma deja de ser relevante para esta ruta.

## Architecture Decisions

### Decision: Signed Upload URLs (Opción A) sobre RLS anónimo (Opción B)

**Choice**: El servidor emite una signed upload URL por documento vía `supabaseAdmin.storage.from('solicitudes').createSignedUploadUrl(path)`, con `path` calculado server-side. El navegador sube con `uploadToSignedUrl(path, token, file)`. **No se crea ninguna política de INSERT para el rol `anon` sobre `storage.objects`.**

**Alternatives considered**: Habilitar RLS en `storage.objects` con una política que permita `INSERT` anónimo en el bucket `solicitudes`, acotada por patrón de path, `file_size_limit` y `allowed_mime_types` del bucket.

**Rationale**:

`/registro` es un formulario **público sin autenticación** — el aspirante todavía no es socio, no tiene cuenta, no hay sesión. Cualquier permiso que le demos se lo damos a Internet entero.

- Con Opción B el permiso es **permanente y ambiental**: mientras la política exista, cualquiera con la anon key (que es pública por definición, viaja en el bundle del navegador) puede escribir en el bucket. El patrón de path de la política es lo único que lo acota, y un patrón como `${matricula}-*` es trivialmente falsificable porque la matrícula la elige el atacante. Queda un bucket de escritura abierta usable como almacenamiento gratuito o vector de abuso, difícil de rate-limitar porque el request ni siquiera pasa por nuestro código.
- Con Opción A el permiso es **puntual, derivado y efímero**: existe sólo después de que el servidor validó los datos, es válido para *un* path exacto elegido por el servidor (no por el cliente), y expira. Para conseguir un permiso hay que pasar por `prepararSubidaSolicitud`, que es código nuestro — o sea que rate-limiting, validación de duplicados y auditoría siguen siendo posibles en el futuro sobre un único punto de entrada.
- Sobre `AGENTS.md` → **"RLS Obligatorio"**: la Opción A es la que respeta mejor el espíritu de esa regla. La postura actual del bucket no necesita abrirse en absoluto; el acceso de escritura sigue siendo exclusivo del `service_role`, exactamente como hoy. La Opción B nos obligaría a redactar y mantener políticas de escritura anónima sobre una tabla del schema `storage`, que es justamente la superficie que la regla busca minimizar.
- Costo de la Opción A: un round-trip extra al servidor antes de subir. Irrelevante frente a la transferencia de 8 documentos.

### Decision: Validar duplicados y manifiesto ANTES de emitir URLs

**Choice**: `prepararSubidaSolicitud` corre las verificaciones de duplicados (email, matrícula, CUIL, teléfono) y la validación del manifiesto (claves obligatorias presentes, tamaño, MIME) *antes* de emitir una sola URL firmada.

**Alternatives considered**: Emitir las URLs primero y validar todo recién en `crearSolicitud`.

**Rationale**: Preserva el orden de validación que hoy ya existe dentro de `crearSolicitud` (duplicados antes de subir, `actions.ts:46-66`), y evita que alguien suba 30 MB para enterarse después de que su email ya estaba registrado. También evita generar huérfanos en el caso de error más probable.

### Decision: El servidor elige el path; el cliente nunca lo propone

**Choice**: El path se calcula server-side como `${matricula}-${key}-${Date.now()}.${ext}`, con `ext` derivada del nombre original pero saneada contra una allowlist (`pdf|jpg|jpeg|png|webp|heic`). El cliente recibe `{ key, path, token }` y no puede alterarlos: el token firmado sólo sirve para ese path.

**Alternatives considered**: Que el cliente proponga el path completo y el servidor lo firme.

**Rationale**: Mantiene intacta la convención de nombres actual (`registro/actions.ts:78`), que es de lo que depende el panel de admin para renderizar los documentos. Además elimina path traversal y colisiones intencionales: si el cliente pudiera elegir el path, podría sobrescribir el documento de otra solicitud.

### Decision: Verificar la existencia real de los objetos antes de persistir

**Choice**: `crearSolicitud` no confía en el mapa `archivos` que le manda el cliente. Para cada `key` lista el bucket por prefijo (`list('', { search: `${matricula}-${key}-` })`) y confirma que el path declarado existe y pertenece a ese prefijo.

**Alternatives considered**: Confiar en el payload del cliente, dado que las URLs fueron emitidas por nosotros.

**Rationale**: El payload JSON de `crearSolicitud` es tan falsificable como cualquier request del cliente. Sin esta verificación, alguien podría crear solicitudes apuntando a documentos de *otras* solicitudes, o a paths inexistentes que dejarían el panel de admin con enlaces rotos y sin forma de detectarlo. Es una comprobación barata (una llamada a Storage) sobre un flujo de baja frecuencia.

### Decision: `crearSolicitud` devuelve `{ success }` en lugar de hacer `redirect()`

**Choice**: `crearSolicitud` deja de llamar `redirect("/registro/exito")` y pasa a devolver `{ success: true }`. La navegación la hace el cliente con `router.push("/registro/exito")`.

**Alternatives considered**: Mantener el `redirect()` dentro de la action y envolver la llamada en `try/catch` en el cliente.

**Rationale**: `redirect()` funciona lanzando una excepción de control (`NEXT_REDIRECT`). Un `try/catch` alrededor de `await crearSolicitud(...)` — que es exactamente lo que este change necesita agregar para arreglar el botón colgado — puede tragarse o confundir ese caso, obligando a discriminar el error de redirect del error real. Devolver `{ success: boolean, error?: string }` elimina la ambigüedad de raíz y además cumple literalmente la regla de `AGENTS.md` → "Error Handling: Siempre capturar errores en Server Actions y devolver un objeto `{ success: boolean, error?: string }`".

### Decision: Límites de tamaño y tipo

**Choice**: 10 MB por archivo, 40 MB en total por solicitud. MIME permitidos: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `image/heic`. Se valida en tres capas: `accept` en el input (guía), chequeo en `handleFileChange` y `handleSubmit` (bloqueo con mensaje), y `file_size_limit` + `allowed_mime_types` en el bucket (frontera real).

**Alternatives considered**: Un límite más bajo (4-5 MB) para mantener paridad con el techo de Vercel.

**Rationale**: 10 MB cubre cómodamente una foto de DNI tomada con un celular moderno (típicamente 3-6 MB) o un título escaneado, que son justamente los casos que hoy rompen el flujo. Poner el límite por debajo de eso reintroduciría el mismo problema por otra vía. Los límites de Supabase Storage son mucho más holgados que el techo de Vercel y no son la restricción operante acá. `image/heic` está incluido porque es el formato por defecto de las cámaras iPhone y su omisión generaría rechazos incomprensibles para el usuario.

### Decision: Limpieza de huérfanos best-effort, no transaccional

**Choice**: `cancelarSubidaSolicitud(paths)` borra los objetos subidos cuando `crearSolicitud` falla o el usuario abandona. Se invoca desde el `catch` del cliente y no bloquea el reporte del error al usuario.

**Alternatives considered**: Subida a un prefijo temporal (`tmp/`) y movimiento a definitivo al confirmar; o job programado de limpieza.

**Rationale**: Un prefijo temporal más un move server-side agrega complejidad y un segundo punto de fallo para resolver un problema cuyo peor caso es un objeto inerte de unos MB que nadie referencia. El borrado best-effort cubre el caso común; lo que se escape es residuo acotado y purgable a mano. Si el volumen de residuo resulta molesto en producción, un job programado es un change posterior de bajo costo.

## Data Flow

    [Usuario: clic "Finalizar Solicitud"]
         │
    [Cliente: valida tamaño (≤10MB c/u, ≤40MB total) y MIME de los 6+2 archivos]
         │  ── falla ──→ [setError(mensaje por documento)] ──→ [setIsPending(false)] ──→ FIN
         │
    [Server Action: prepararSubidaSolicitud({ campos texto, manifiesto })]
         │
         ├─→ [Zod: valida campos + manifiesto]
         ├─→ [Prisma: chequea duplicados email / matrícula / CUIL / teléfono]
         ├─→ [Valida que estén los 6 documentos obligatorios]
         └─→ [supabaseAdmin.storage.createSignedUploadUrl(`${matricula}-${key}-${ts}.${ext}`)] × N
                  │
         ← { success: true, uploads: [{ key, path, token }] }
         │
    [Cliente: por cada archivo → supabaseBrowser.storage
              .from('solicitudes').uploadToSignedUrl(path, token, file)]
         │           │
         │           └──────────→ [Supabase Storage]   ← los bytes NO pasan por Vercel
         │  ── falla ──→ [cancelarSubidaSolicitud(paths ya subidos)]
         │                 └──→ [setError] ──→ [setIsPending(false)] ──→ FIN
         │
    [Server Action: crearSolicitud({ campos texto, archivos: { key: path } })]  ← payload de KB
         │
         ├─→ [Zod: valida payload]
         ├─→ [Prisma: re-chequea duplicados (guarda contra carrera)]
         ├─→ [Storage: verifica que cada path exista y respete el prefijo esperado]
         ├─→ [Prisma: solicitud.create({ datos: { ..., archivos } })]   ← misma forma que hoy
         ├─→ [Resend: aviso institucional + confirmación al solicitante]
         └─→ [revalidatePath("/admin/solicitudes")]
                  │
         ← { success: true }
         │
    [Cliente: router.push("/registro/exito")]

Flujo de error (el bug que este change repara): **cualquier** rama de fallo termina en `setError(...)` visible en la UI y `setIsPending(false)` dentro de un `finally`. No existe camino en el que el botón quede en "Procesando…".

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/supabase/client.ts` | Create | Cliente browser (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`), sin sesión persistida. Único uso: `uploadToSignedUrl`. |
| `src/lib/validations/solicitud.ts` | Create | `manifiestoArchivoSchema`, `prepararSubidaSchema`, `crearSolicitudSchema` y las constantes `MAX_FILE_SIZE`, `MAX_TOTAL_SIZE`, `ALLOWED_MIME_TYPES`, `ARCHIVOS_REQUERIDOS`, `ARCHIVOS_OPCIONALES`. |
| `src/app/registro/actions.ts` | Modify | Agrega `prepararSubidaSolicitud` y `cancelarSubidaSolicitud`. `crearSolicitud` cambia de firma (`FormData` → objeto tipado), pierde el bloque de subida (líneas ~68-93), gana verificación de paths en Storage y devuelve `{ success }` en vez de `redirect()`. |
| `src/app/registro/page.tsx` | Modify | `handleFileChange` valida tamaño/MIME; nuevo estado `erroresArchivo` y `errorGlobal`; `handleSubmit` orquesta preparar → subir → crear con `try/catch/finally`; `accept` en los inputs; feedback por documento (pendiente/subiendo/listo/error); panel de error en lugar de `alert()`. |
| `src/app/registro/actions.test.ts` | Create | Tests unitarios de validación de manifiesto, construcción de path y detección de duplicados. |
| Supabase → bucket `solicitudes` | Config | `file_size_limit = 10485760`; `allowed_mime_types` según allowlist. Sin políticas nuevas. |
| `src/app/admin/solicitudes/**` | Unchanged | Verificado, no modificado. |
| `next.config.ts` | Unchanged | `bodySizeLimit: "4mb"` se mantiene: `mi-panel/perfil/actions.ts` y `admin/circulares/actions.ts` siguen subiendo por el body. |

## Interfaces / Contracts

```typescript
// src/lib/validations/solicitud.ts
export const MAX_FILE_SIZE = 10 * 1024 * 1024;   // 10 MB por archivo
export const MAX_TOTAL_SIZE = 40 * 1024 * 1024;  // 40 MB por solicitud

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp", "heic"] as const;

// La lista NO cambia respecto del flujo actual.
export const ARCHIVOS_REQUERIDOS = ["dni", "titulo", "cuit", "seguro", "cv", "matricula_file"] as const;
export const ARCHIVOS_OPCIONALES = ["super_salud", "habilitacion"] as const;

export const manifiestoArchivoSchema = z.object({
  key: z.enum([...ARCHIVOS_REQUERIDOS, ...ARCHIVOS_OPCIONALES]),
  nombre: z.string().min(1).max(255),
  tamano: z.number().int().positive().max(MAX_FILE_SIZE),
  tipo: z.enum(ALLOWED_MIME_TYPES),
});
```

```typescript
// src/app/registro/actions.ts

/** Paso 1: valida y emite un permiso de escritura por documento. */
export async function prepararSubidaSolicitud(input: {
  nombre: string; apellido: string; email: string; matricula: string;
  dni: string; telefono: string;
  manifiesto: Array<{ key: string; nombre: string; tamano: number; tipo: string }>;
}): Promise<
  | { success: true; uploads: Array<{ key: string; path: string; token: string }> }
  | { success: false; error: string }
>;

/** Paso 3: persiste la solicitud a partir de paths ya subidos. Payload de KB. */
export async function crearSolicitud(input: {
  nombre: string; apellido: string; email: string; matricula: string;
  dni: string; telefono: string; direccion: string;
  localidadId: string; especialidad: string;
  archivos: Record<string, string>;   // key -> path en el bucket `solicitudes`
}): Promise<{ success: boolean; error?: string }>;

/** Limpieza best-effort de objetos huérfanos. Nunca lanza. */
export async function cancelarSubidaSolicitud(paths: string[]): Promise<void>;
```

```typescript
// src/lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
```

```typescript
// src/app/registro/page.tsx — forma del handleSubmit (el bug reparado)
const handleSubmit = async () => {
  if (!validateStep(3)) { setErrorGlobal("Cargá todos los documentos requeridos."); return; }

  setIsPending(true);
  setErrorGlobal(null);
  const subidos: string[] = [];

  try {
    const prep = await prepararSubidaSolicitud({ ...formData, manifiesto });
    if (!prep.success) { setErrorGlobal(prep.error); return; }

    for (const { key, path, token } of prep.uploads) {
      setEstadoArchivo(key, "subiendo");
      const { error } = await supabaseBrowser.storage
        .from("solicitudes")
        .uploadToSignedUrl(path, token, archivos[key]!);
      if (error) throw new Error(`No se pudo subir "${LABELS[key]}": ${error.message}`);
      subidos.push(path);
      setEstadoArchivo(key, "listo");
    }

    const res = await crearSolicitud({ ...formData, archivos: mapDePaths(prep.uploads) });
    if (!res.success) { await cancelarSubidaSolicitud(subidos); setErrorGlobal(res.error!); return; }

    router.push("/registro/exito");
  } catch (e) {
    await cancelarSubidaSolicitud(subidos).catch(() => {});
    setErrorGlobal(e instanceof Error ? e.message : "Ocurrió un error inesperado. Reintentá en unos minutos.");
  } finally {
    setIsPending(false);   // ← garantía: el botón nunca queda colgado
  }
};
```

```sql
-- Supabase SQL Editor: endurecer el bucket. NO se agregan políticas de escritura.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array[
      'application/pdf','image/jpeg','image/png','image/webp','image/heic'
    ]
where id = 'solicitudes';
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (vitest) | Validación de manifiesto | `prepararSubidaSchema` rechaza archivo > 10 MB, MIME no permitido, y falta de alguno de los 6 obligatorios. |
| Unit (vitest) | Construcción y saneo de path | El path generado sigue `${matricula}-${key}-${ts}.${ext}` y una extensión no permitida (`.exe`, `../x`) se rechaza. |
| Unit (vitest) | Duplicados | `prepararSubidaSolicitud` devuelve `{ success: false }` con email/matrícula/CUIL/teléfono ya existentes, sin emitir URLs. |
| Integration | Subida directa real | Enviar una solicitud con 8 documentos que sumen > 10 MB desde el navegador y verificar en el dashboard de Supabase que los 8 objetos existen con el nombre esperado. |
| Integration | Body sin archivos | Con las DevTools abiertas, confirmar que el request a la Server Action `crearSolicitud` pesa KB y no contiene binarios. |
| Error Handling | Botón colgado (el bug) | Simular fallo de red a mitad de subida (DevTools → Offline) y verificar que aparece mensaje de error y el botón se rehabilita. |
| Error Handling | Archivo pesado | Seleccionar un archivo de 25 MB: error inmediato junto a ese documento, sin request al servidor. |
| Security | Path falsificado | Llamar `crearSolicitud` con un `archivos` que apunte a un path inexistente o de otra matrícula: debe fallar sin crear la `Solicitud`. |
| Security | Escritura anónima | Intentar `supabaseBrowser.storage.from('solicitudes').upload(...)` sin token firmado: debe ser rechazado (confirma que no se abrió el bucket). |
| Regression | Panel de admin | Abrir en `/admin/solicitudes/[id]` una solicitud creada con el flujo nuevo: los 8 enlaces deben resolver. Aprobarla con `gestionarSolicitud`. |
| Regression | Otras rutas de subida | Subir foto de perfil (`/mi-panel/perfil`) y adjunto de circular (`/admin/circulares`): siguen funcionando con `bodySizeLimit: "4mb"` intacto. |

## Migration / Rollout

No hay cambios en `schema.prisma` ni migración de datos: la forma de `datos.archivos` (`Record<string, string>` de key → path) es idéntica a la actual.

Orden de despliegue:

1. Configurar el bucket `solicitudes` en Supabase (`file_size_limit`, `allowed_mime_types`). Es retrocompatible: el flujo viejo sigue funcionando mientras el límite por archivo sea ≥ al que hoy tolera.
2. Verificar que `NEXT_PUBLIC_SUPABASE_ANON_KEY` esté definida en el entorno de Vercel (hoy el proyecto sólo consume la service role key server-side).
3. Desplegar el código. El cambio es atómico entre cliente y servidor — `crearSolicitud` cambia de firma, así que no hay ventana de convivencia entre la versión vieja del cliente y la nueva del servidor más allá de las sesiones abiertas en el momento del deploy. Dado el volumen del formulario (bajo, unas pocas solicitudes por día) se acepta el riesgo; conviene desplegar fuera del horario de mayor uso.
4. Solicitudes ya existentes: no se tocan. Sus paths siguen la misma convención y el panel de admin las lee igual.

## Open Questions

- [ ] ¿10 MB por archivo y 40 MB por solicitud son los límites correctos para el Círculo? Si la comisión suele recibir títulos escaneados en alta resolución, puede convenir subir el techo por archivo a 15 MB.
- [ ] ¿Se quiere compresión automática de imágenes en el navegador antes de subir (ej. reducir una foto de DNI de 8 MB a 1 MB)? Mejoraría mucho el tiempo de subida en conexiones móviles, pero agrega una dependencia y riesgo de pérdida de legibilidad en documentos. Fuera de alcance de este change salvo indicación contraria.
- [ ] ¿Se acepta la limpieza best-effort de huérfanos, o se quiere un job programado de purga desde el arranque? Recomendación: empezar best-effort y medir.
- [ ] El bucket `solicitudes` es de lectura pública (`src/app/admin/solicitudes/[id]/page.tsx:46` arma URLs `/object/public/solicitudes`). Eso significa que DNIs, títulos y CVs son accesibles por cualquiera que conozca o adivine el nombre del objeto — y el nombre es predecible: `${matricula}-dni-${timestamp}`. **Este change no lo empeora, pero conviene decidir si se abre un change de seguimiento para pasar a `createSignedUrl` en el panel de admin.** Recomendación: sí, y con prioridad.
- [ ] ¿Se quiere rate-limiting sobre `prepararSubidaSolicitud` para evitar que alguien pida URLs firmadas en masa? La Opción A lo hace posible (todo pasa por código nuestro), pero no lo implementa. Se sugiere evaluarlo si aparece abuso.
