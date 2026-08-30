# Proposal: registro-upload-directo

## Intent

El formulario público de registro profesional (`/registro`) envía hasta 8 documentos (6 obligatorios + 2 opcionales) dentro de un único `FormData` que viaja como body de la Server Action `crearSolicitud`. Ese body atraviesa una Vercel Serverless Function, que impone un techo duro de ~4.5 MB en la capa de routing de la plataforma — un límite que **no** se levanta pagando un plan superior. El valor `experimental.serverActions.bodySizeLimit: "4mb"` de `next.config.ts` fue elegido para quedar apenas por debajo de ese techo; subirlo no resuelve nada porque Vercel rechaza igual.

Seis a ocho documentos reales (fotos de DNI frente y dorso tomadas con el celular, un título escaneado, una póliza en PDF, un CV) superan con facilidad los 4 MB combinados. Cuando eso ocurre hoy el resultado es el peor posible:

- No hay validación de tamaño ni restricción de tipo en los `<input type="file">` de `src/app/registro/page.tsx`: el usuario no recibe ninguna advertencia previa.
- `handleSubmit` (`src/app/registro/page.tsx`, ~línea 92-112) llama `await crearSolicitud(data)` **sin `try/catch`**, y `setIsPending(false)` sólo se ejecuta dentro de la rama `if (result?.error)`. Si Vercel/Next.js rechaza el request antes de que el cuerpo de `crearSolicitud` llegue a correr, la promesa queda rechazada sin manejar: el botón gira "Procesando…" para siempre, sin mensaje, sin recuperación posible salvo recargar. El aspirante abandona el trámite y el Círculo pierde la solicitud sin enterarse.

Este cambio mueve la subida de archivos a **navegador → Supabase Storage directo**, de modo que los bytes nunca pasen por el body de la Server Action, y repara en el mismo movimiento la validación cliente y el manejo de errores que hoy faltan.

## Scope

### In Scope

- Nueva Server Action `prepararSubidaSolicitud` en `src/app/registro/actions.ts` que valida datos de texto + manifiesto de archivos y emite **signed upload URLs** de corta vida (una por documento), con el path del objeto elegido por el servidor.
- Subida directa desde el navegador a Supabase Storage mediante `uploadToSignedUrl`, con cliente browser nuevo en `src/lib/supabase/client.ts` (anon key).
- Refactor de `crearSolicitud` para recibir sólo campos de texto + el mapa de paths ya subidos (payload JSON pequeño), re-validar duplicados y verificar en Storage que cada path declarado exista y respete el prefijo esperado antes de persistir.
- Validación cliente de tamaño por archivo y total, y de tipo MIME (imágenes + PDF), con mensaje de error visible por documento.
- Endurecimiento del bucket `solicitudes` en Supabase: `file_size_limit` y `allowed_mime_types`.
- Corrección del bug de UX: `handleSubmit` con `try/catch` + `finally`, estado de error renderizado en la UI (no `alert`), y garantía de que `isPending` siempre se resetea.
- Server Action `cancelarSubidaSolicitud` de limpieza best-effort para archivos huérfanos cuando la subida se completa pero la creación de la solicitud falla.
- Esquema Zod para el payload de ambas Server Actions (`AGENTS.md` → "Validation").

### Out of Scope

- Cambiar la lista de documentos requeridos vs. opcionales. Se mantiene exactamente igual: 6 obligatorios (`dni`, `titulo`, `cuit`, `seguro`, `cv`, `matricula_file`) y 2 opcionales (`super_salud`, `habilitacion`). Este cambio es sobre **cómo** llegan los archivos a Storage, no sobre **qué** se pide.
- Cambiar la convención de nombres de los objetos en Storage (`${matricula}-${key}-${timestamp}.${ext}`) ni la forma de `datos.archivos` en Prisma. `src/app/admin/solicitudes/[id]/page.tsx` y `gestionarSolicitud` en `src/app/admin/solicitudes/actions.ts` deben seguir funcionando **sin ninguna modificación**.
- Bajar `experimental.serverActions.bodySizeLimit`. Otras Server Actions siguen subiendo archivos por el body (`src/app/mi-panel/perfil/actions.ts` → bucket `profesionales-fotos`; `src/app/admin/circulares/actions.ts` → bucket `circulares-adjuntos`). Tocar el límite global las rompería. Migrar esas dos rutas al mismo patrón queda como trabajo posterior.
- Barra de progreso por archivo (%) o subida reanudable (TUS/resumable). Se implementa progreso por estados discretos (pendiente / subiendo / listo / error), no por porcentaje.
- Revisar la postura de lectura pública del bucket `solicitudes`. Hoy el detalle de admin arma URLs con `/storage/v1/object/public/solicitudes` (ver Riesgos): eso ya es así y no empeora con este cambio, pero merece un change propio.

## Capabilities

### Modified Capabilities

- `socio-onboarding`: se modifica el mecanismo de carga documental de la solicitud pública. Los archivos dejan de viajar por el body de la Server Action y pasan a subirse directo a Storage con URLs firmadas emitidas por el servidor. Se agregan requerimientos de validación de tamaño/tipo en cliente y de recuperación ante error de subida.

## Approach

1. **Emitir permisos, no abrir el bucket.** Una Server Action liviana valida los datos y devuelve una signed upload URL por documento, cada una atada a un path concreto elegido por el servidor. No se crea ninguna política de escritura anónima sobre `storage.objects`. Ver `design.md` → "Decision: Signed Upload URLs (Opción A) sobre RLS anónimo (Opción B)".
2. **Validar antes de gastar bytes.** Las verificaciones de duplicados (email, matrícula, CUIL, teléfono) y de completitud documental se mueven a `prepararSubidaSolicitud`, es decir **antes** de que el navegador suba nada. Hoy ese orden ya existe dentro de `crearSolicitud`; se preserva, pero ahora evita además subidas inútiles.
3. **Subir en el navegador.** `uploadToSignedUrl` sube archivo por archivo con el cliente browser de Supabase. El request no toca Vercel: va directo al endpoint de Storage. El techo de ~4.5 MB deja de aplicar.
4. **Persistir sólo referencias.** `crearSolicitud` pasa a recibir un objeto JSON de unos pocos KB: campos de texto + `archivos: Record<string, string>`. Re-valida duplicados (por si hubo carrera entre paso 1 y paso 4), confirma contra Storage que cada path existe y arranca con el prefijo `${matricula}-${key}-`, y recién ahí crea la `Solicitud` y dispara los emails.
5. **Fallar en voz alta.** Cualquier error — archivo pesado, MIME no permitido, red caída, rechazo de Storage, duplicado detectado — se captura en el cliente, se muestra en la UI con el documento culpable identificado, y siempre libera el botón.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/supabase/client.ts` | New | Cliente browser de Supabase (anon key) usado sólo para `uploadToSignedUrl`. |
| `src/lib/validations/solicitud.ts` | New | Esquemas Zod del manifiesto de archivos y del payload de creación. |
| `src/app/registro/actions.ts` | Modified | Nuevas actions `prepararSubidaSolicitud` y `cancelarSubidaSolicitud`; `crearSolicitud` deja de recibir archivos. |
| `src/app/registro/page.tsx` | Modified | Validación de tamaño/tipo, orquestación de subida directa, estados por archivo, `try/catch/finally` en `handleSubmit`, panel de error. |
| Supabase Storage (bucket `solicitudes`) | Config | `file_size_limit` y `allowed_mime_types`. Sin políticas nuevas de escritura. |
| `src/app/admin/solicitudes/**` | Unchanged | Contrato de paths y de `datos.archivos` intacto por diseño. |
| `next.config.ts` | Unchanged | `bodySizeLimit` se mantiene en `"4mb"` por las otras rutas de subida. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Archivos huérfanos en Storage si la subida termina pero `crearSolicitud` falla | Medium | `cancelarSubidaSolicitud` borra best-effort desde el cliente en el `catch`; además el objeto huérfano es inerte (no referenciado por ninguna `Solicitud`). Se propone purga manual periódica — ver Open Questions en `design.md`. |
| Cliente malicioso declara paths que no subió | Low | `crearSolicitud` verifica contra Storage la existencia de cada path y que coincida con el prefijo `${matricula}-${key}-` emitido por el servidor. Sin esa verificación el payload JSON sería falsificable. |
| Carrera de duplicados entre `prepararSubidaSolicitud` y `crearSolicitud` | Low | Se re-ejecutan las verificaciones de duplicados en `crearSolicitud`; el error resultante limpia los archivos ya subidos. |
| Expiración del token firmado en conexiones lentas | Low | Los signed upload URLs de Supabase viven 2 horas por defecto, muy por encima de cualquier subida razonable de 8 documentos. Si expira, el error se muestra y se ofrece reintentar (re-emite URLs frescas). |
| Regresión en el panel de admin | Low | Los nombres de objeto y la estructura `datos.archivos` no cambian. Task de verificación explícita abriendo una solicitud creada con el flujo nuevo. |
| Los documentos del bucket `solicitudes` son legibles públicamente por URL | — (pre-existente) | Fuera de alcance, pero queda registrado: `src/app/admin/solicitudes/[id]/page.tsx:46` construye URLs `/object/public/solicitudes`. Se recomienda un change posterior que pase a `createSignedUrl`. Este cambio no lo agrava. |

## Rollback Plan

- `git revert` del commit: `crearSolicitud` vuelve a aceptar `FormData` con archivos y `registro/page.tsx` vuelve al envío monolítico.
- Los archivos ya subidos con el flujo nuevo quedan en el mismo bucket con la misma convención de nombres, así que las solicitudes creadas durante la ventana del cambio siguen siendo legibles desde el panel de admin tras el revert.
- La configuración del bucket (`file_size_limit`, `allowed_mime_types`) puede quedar aplicada sin romper el flujo viejo, siempre que el límite por archivo sea mayor o igual al que tolera el flujo server-side. No requiere rollback.
- No hay migración de datos ni cambios en `schema.prisma`, por lo que no hay nada que revertir en la base.

## Dependencies

- `@supabase/supabase-js` ^2.105.3 (ya instalado) — `createSignedUploadUrl` / `uploadToSignedUrl`.
- `zod` ^4.4.3 (ya instalado) — validación de payloads.
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` disponibles en el navegador. **Verificar que la anon key esté presente en el entorno de Vercel**; hoy sólo se usa `SUPABASE_SERVICE_ROLE_KEY` server-side en `src/lib/supabase/admin.ts`.
- Acceso al dashboard de Supabase para configurar el bucket `solicitudes`.

## Success Criteria

- [ ] Una solicitud con 8 documentos que suman más de 10 MB se envía correctamente de punta a punta, sin error de tamaño de body.
- [ ] Ningún archivo viaja dentro del body de una Server Action: el payload de `crearSolicitud` es JSON de campos de texto + paths.
- [ ] Seleccionar un archivo mayor al límite por archivo muestra un error inmediato junto a ese documento y bloquea el envío, sin llamar al servidor.
- [ ] Seleccionar un archivo con tipo no permitido (ej. `.zip`, `.exe`) se rechaza en el cliente con mensaje claro.
- [ ] Ante cualquier fallo (red caída a mitad de subida, duplicado, rechazo de Storage) el botón vuelve a estar habilitado y se muestra un mensaje accionable. El botón nunca queda girando.
- [ ] El bucket `solicitudes` no tiene ninguna política nueva de escritura para el rol `anon`; la escritura sigue dependiendo de un permiso emitido por el servidor.
- [ ] `src/app/admin/solicitudes/[id]/page.tsx` muestra y abre los 8 documentos de una solicitud creada con el flujo nuevo, sin cambios en su código.
- [ ] `gestionarSolicitud` aprueba una solicitud creada con el flujo nuevo sin modificaciones.
