# Tasks: registro-upload-directo

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~400-470 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Supabase + validaciones + Server Actions (Fases 1-3). PR 2: cliente browser + UI de registro (Fases 4-5). |
| Delivery strategy | ask-on-risk |
| Chain strategy | chained-2 |

Decision needed before apply: Sí — confirmar límites de tamaño (10 MB / 40 MB) y responder las Open Questions de `design.md` antes de la Fase 2.
Chained PRs recommended: Yes
400-line budget risk: Medium

## Phase 1: Supabase (Configuración de Storage)

- [x] 1.1 Verificar en el dashboard de Supabase que el bucket `solicitudes` existe y confirmar su postura actual de RLS/políticas. Documentar el estado previo antes de tocar nada.
- [x] 1.2 Ejecutar en el SQL Editor: `update storage.buckets set file_size_limit = 10485760, allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp','image/heic'] where id = 'solicitudes';`
- [x] 1.3 Confirmar explícitamente que **NO** se agregó ninguna política de `INSERT`/`UPDATE` para el rol `anon` sobre `storage.objects`. La escritura debe seguir siendo exclusiva del `service_role` (Opción A del diseño). Dejar constancia en el PR. — se encontró y eliminó una política `INSERT` anónima preexistente (`"Permitir subidas anonimas"`), no relacionada a este change, ya abierta desde 2026-05-04.
- [ ] 1.4 Verificar que `NEXT_PUBLIC_SUPABASE_ANON_KEY` esté definida en `.env.local` y en las variables de entorno de Vercel (Production y Preview). Hoy el proyecto sólo consume la service role key server-side. — confirmada localmente; **falta confirmar en Vercel**.
- [x] 1.5 Verificar que la lectura pública del bucket sigue funcionando (el panel de admin depende de `/object/public/solicitudes`). No modificarla en este change.

## Phase 2: Backend — Validaciones y contratos

- [x] 2.1 Crear `src/lib/validations/solicitud.ts` con las constantes `MAX_FILE_SIZE` (10 MB), `MAX_TOTAL_SIZE` (40 MB), `ALLOWED_MIME_TYPES`, `ALLOWED_EXTENSIONS`, `ARCHIVOS_REQUERIDOS` y `ARCHIVOS_OPCIONALES`. La lista de requeridos/opcionales debe ser idéntica a la actual: 6 requeridos (`dni`, `titulo`, `cuit`, `seguro`, `cv`, `matricula_file`) y 2 opcionales (`super_salud`, `habilitacion`).
- [x] 2.2 Definir `manifiestoArchivoSchema` (key, nombre, tamano, tipo) con Zod, aplicando los límites de tamaño y la allowlist de MIME.
- [x] 2.3 Definir `prepararSubidaSchema` (campos de texto + array de manifiesto) validando que estén presentes los 6 documentos obligatorios y que la suma de tamaños no supere `MAX_TOTAL_SIZE`.
- [x] 2.4 Definir `crearSolicitudSchema` (campos de texto + `archivos: Record<string, string>`), sin campos binarios.
- [x] 2.5 Implementar helper `construirPathArchivo(matricula, key, nombreOriginal)` que devuelva `${matricula}-${key}-${Date.now()}.${ext}` con la extensión saneada contra `ALLOWED_EXTENSIONS`. Debe rechazar extensiones desconocidas y cualquier intento de path traversal.

## Phase 3: Backend — Server Actions

- [x] 3.1 Extraer la lógica de verificación de duplicados actual de `crearSolicitud` (`src/app/registro/actions.ts:46-56`) a un helper reutilizable `verificarDuplicados({ email, matricula, cuil, telefono })`.
- [x] 3.2 Implementar `prepararSubidaSolicitud(input)` en `src/app/registro/actions.ts`: valida con `prepararSubidaSchema`, corre `verificarDuplicados`, y sólo si todo pasa emite una signed upload URL por documento vía `supabaseAdmin.storage.from('solicitudes').createSignedUploadUrl(path)`.
- [x] 3.3 Asegurar que `prepararSubidaSolicitud` devuelve `{ success: true, uploads: [{ key, path, token }] }` o `{ success: false, error }`, nunca lanza al cliente.
- [x] 3.4 Refactorizar `crearSolicitud` para recibir un objeto tipado en vez de `FormData` con archivos. Eliminar por completo el bloque de subida server-side (`actions.ts:68-93`).
- [x] 3.5 En `crearSolicitud`, re-ejecutar `verificarDuplicados` antes de persistir (protección contra carrera entre el paso 1 y el paso 3).
- [x] 3.6 En `crearSolicitud`, verificar contra Storage que cada path declarado exista y respete el prefijo `${matricula}-${key}-`. Si algún path no verifica, abortar sin crear la `Solicitud` y devolver error.
- [x] 3.7 Confirmar que `prisma.solicitud.create` sigue guardando `datos.archivos` con exactamente la misma forma (`Record<key, path>`) que hoy, para no romper el panel de admin.
- [x] 3.8 Reemplazar `redirect("/registro/exito")` por `return { success: true }` (ver "Decision: `crearSolicitud` devuelve `{ success }`" en `design.md`). Mantener intacto el envío de emails con Resend y el `revalidatePath("/admin/solicitudes")`.
- [x] 3.9 Implementar `cancelarSubidaSolicitud(paths: string[])`: borra best-effort vía `supabaseAdmin.storage.from('solicitudes').remove(paths)`. No debe lanzar nunca.
- [x] 3.10 Crear `src/app/registro/actions.test.ts` con tests unitarios (vitest) de: manifiesto inválido por tamaño, manifiesto inválido por MIME, falta de documento obligatorio, construcción y saneo de path, y detección de duplicados sin emisión de URLs.

## Phase 4: Frontend — Cliente Supabase y validación de archivos

- [x] 4.1 Crear `src/lib/supabase/client.ts` exportando `supabaseBrowser` con `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `{ auth: { persistSession: false, autoRefreshToken: false } }`.
- [x] 4.2 En `src/app/registro/page.tsx`, agregar `accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,image/*,application/pdf"` a los 8 `<input type="file">`.
- [x] 4.3 Extender `handleFileChange` para validar tamaño (`MAX_FILE_SIZE`) y MIME (`ALLOWED_MIME_TYPES`) al momento de seleccionar. Si falla, no guardar el archivo en el estado y registrar el error en el nuevo estado `erroresArchivo: Record<string, string | null>`.
- [x] 4.4 Renderizar el error por documento dentro de la tarjeta correspondiente (borde/fondo rojo + texto), respetando la estética actual (rounded, sin px fijos, escalas de Tailwind).
- [x] 4.5 Validar el total acumulado (`MAX_TOTAL_SIZE`) y mostrar un aviso agregado cuando se supera.

## Phase 5: Frontend — Orquestación de subida y manejo de errores

- [x] 5.1 Agregar estado `errorGlobal: string | null` y `estadoArchivos: Record<string, "pendiente" | "subiendo" | "listo" | "error">`.
- [x] 5.2 Reescribir `handleSubmit` con la secuencia: construir manifiesto → `prepararSubidaSolicitud` → subir cada archivo con `uploadToSignedUrl` → `crearSolicitud` → `router.push("/registro/exito")`.
- [x] 5.3 Envolver todo `handleSubmit` en `try/catch/finally`, con `setIsPending(false)` en el `finally`. **Este es el fix del bug del botón colgado** — no debe existir ninguna ruta de salida que deje el botón en "Procesando…".
- [x] 5.4 En el `catch` y en las ramas de fallo, invocar `cancelarSubidaSolicitud(subidos)` para limpiar huérfanos, sin bloquear el reporte del error al usuario.
- [x] 5.5 Reemplazar los `alert()` existentes por un panel de error renderizado en la UI, con el documento culpable identificado por su label legible (no por su key técnica).
- [x] 5.6 Reflejar `estadoArchivos` en las tarjetas de documento durante la subida (spinner en "subiendo", check en "listo", icono de error en "error").
- [x] 5.7 Importar `useRouter` de `next/navigation` y navegar a `/registro/exito` sólo ante `{ success: true }`.

## Phase 6: Verificación (Manual + Regresión)

- [ ] 6.1 Escenario feliz pesado: enviar una solicitud con los 8 documentos sumando más de 10 MB. Debe completarse sin error de tamaño de body.
- [ ] 6.2 Con DevTools → Network, confirmar que el request de la Server Action `crearSolicitud` pesa KB y no contiene binarios.
- [ ] 6.3 Escenario archivo pesado: seleccionar un archivo de ~25 MB. Debe mostrarse error inmediato junto a ese documento y **no** dispararse ningún request al servidor.
- [ ] 6.4 Escenario tipo inválido: seleccionar un `.zip` o `.exe`. Debe rechazarse en el cliente con mensaje claro.
- [ ] 6.5 Escenario red caída: activar DevTools → Offline a mitad de subida. Debe aparecer mensaje de error y el botón debe rehabilitarse.
- [ ] 6.6 Escenario duplicado: enviar con un email ya registrado. Debe fallar en `prepararSubidaSolicitud`, sin haber subido ningún archivo a Storage (verificar en el dashboard).
- [ ] 6.7 Escenario seguridad — path falsificado: invocar `crearSolicitud` con un `archivos` que apunte a un path inexistente o de otra matrícula. No debe crearse la `Solicitud`.
- [ ] 6.8 Escenario seguridad — escritura anónima: intentar `supabaseBrowser.storage.from('solicitudes').upload(...)` sin token firmado. Debe ser rechazado, confirmando que el bucket no se abrió.
- [ ] 6.9 Regresión admin: abrir en `/admin/solicitudes/[id]` una solicitud creada con el flujo nuevo. Los 8 enlaces deben resolver y abrir el documento correcto, **sin haber modificado** `src/app/admin/solicitudes/`.
- [ ] 6.10 Regresión admin: aprobar esa solicitud con `gestionarSolicitud` y verificar que el flujo de invitación y creación de `Profesional` funciona igual que antes.
- [ ] 6.11 Regresión otras subidas: subir una foto de perfil en `/mi-panel/perfil` y un adjunto en `/admin/circulares`. Deben seguir funcionando con `bodySizeLimit: "4mb"` intacto.
- [ ] 6.12 Ejecutar `npm test` y confirmar que la suite completa pasa.
- [ ] 6.13 Verificar responsive del formulario en mobile (los nuevos mensajes de error y estados no deben romper el layout ni introducir `px` fijos).
- [ ] 6.14 Limpiar `console.log` de depuración antes del commit (`AGENTS.md` → "No Console Logs").
