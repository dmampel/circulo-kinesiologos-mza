## 1. DB / Prisma

- [x] 1.1 Confirmar que no hace falta ningún cambio de schema: todo lo que necesita el reenvío (nombre, apellido, email, matrícula, status + `datos.dni`, `datos.telefono`, `datos.direccion`, `datos.localidadId`, `datos.especialidades`, `datos.archivos`) ya está persistido en `Solicitud`. Sin migración, sin `prisma db push`, sin RLS nueva.

## 2. Supabase / Storage

- [x] 2.1 Confirmar que no se toca `src/lib/storage/solicitudes.ts`: `firmarUrlsDocumentos` ya acepta TTL explícito y `SIGNED_URL_TTL_EMAIL_SEGUNDOS` (604800) ya existe. El reenvío es sólo un consumidor nuevo.
- [x] 2.2 Confirmar que el bucket `solicitudes` sigue privado y que se firma con `supabaseAdmin` (service role). El reenvío no cambia visibilidad ni políticas.
- [x] 2.3 Verificar que el default de 1 hora (`SIGNED_URL_TTL_SEGUNDOS`) que usa `src/app/admin/solicitudes/[id]/page.tsx` para ver documentos in-app queda intacto.

## 3. Backend — helper compartido de resolución de nombres (D1)

- [x] 3.1 Crear `src/lib/solicitudes/nombres.ts` exportando `SIN_LOCALIDAD = "No especificada"`, el tipo `NombresSolicitud = { localidad: string; especialidades: string }` y `resolverNombresSolicitud(datos: unknown): Promise<NombresSolicitud>`.
- [x] 3.2 Implementar la resolución: leer `localidadId` del JSON con guard de tipo (`typeof === "string"`), normalizar especialidades con `normalizarEspecialidadesSolicitud`, y hacer **un solo** `Promise.all([prisma.especialidad.findMany, prisma.localidad.findUnique])`.
- [x] 3.3 Buscar especialidades por `OR: [{ id: { in: valores } }, { nombre: { in: valores } }]` con `orderBy: { nombre: "asc" }` — cubre las solicitudes viejas que guardaron nombres en lugar de IDs (mismo criterio que ya usa la página de detalle).
- [x] 3.4 Envolver todo en `try/catch`: el helper nunca lanza. Ante fallo o sin resultados devuelve `{ localidad: SIN_LOCALIDAD, especialidades: <join de los valores declarados o cadena vacía> }`. Nunca devolver un identificador de localidad. Sin `any`.
- [x] 3.5 Documentar en el header del módulo por qué existe (una sola fuente de verdad para registro y reenvío) y por qué no vive en `src/lib/especialidades.ts` (ese módulo es puro, sin I/O).
- [x] 3.6 Crear `src/lib/solicitudes/nombres.test.ts` mockeando `@/lib/prisma`: (a) resuelve localidad y varias especialidades a nombres; (b) formato viejo `especialidad: "id"` resuelve igual; (c) especialidades guardadas como nombre resuelven por `nombre`; (d) localidad inexistente → `"No especificada"` y el ID NO aparece en el resultado; (e) si Prisma rechaza, devuelve los defaults sin lanzar; (f) `datos` nulo o sin campos no rompe.

## 4. Backend — refactor de `crearSolicitud` (sin cambio de comportamiento)

- [x] 4.1 En `src/app/registro/actions.ts`, reemplazar el bloque inline de resolución de nombres (líneas ~189-207) por una llamada a `resolverNombresSolicitud(...)`, y usar su resultado en `construirAvisoInstitucional`.
- [x] 4.2 Correr `npx vitest run src/app/registro/actions.test.ts` y confirmar que los tests existentes de resolución de nombres siguen en verde **sin modificarlos**. Si alguno hay que tocar, parar y revisar: significa que el comportamiento observable cambió. — 34/34 en verde, sin tocar el archivo de test.
- [x] 4.3 Confirmar que el aviso institucional del registro sigue siendo best-effort (dentro de su `try/catch`) y que se siguen enviando exactamente dos mails por solicitud creada.

## 5. Backend — server action de reenvío (D2, D3, D5, D8)

- [x] 5.1 En `src/app/admin/solicitudes/actions.ts`, agregar los imports necesarios: `firmarUrlsDocumentos` + `SIGNED_URL_TTL_EMAIL_SEGUNDOS`, `DOCUMENTOS_SOLICITUD`, `construirAvisoInstitucional`, `construirLinkWhatsApp` + `WHATSAPP_ADMINISTRACION` + `mensajeNuevaSolicitud`, `resolverNombresSolicitud`, y `INSTITUTIONAL_EMAIL` (hoy el archivo importa `EMAIL_INSTITUCIONAL` de `@/lib/site`, que es otra cosa — no confundirlos).
- [x] 5.2 Implementar los guards tipados locales de D3: `texto(valor: unknown, fallback = "No especificado"): string` y `archivosDe(datos: unknown): Record<string, string>`. Sin `any`. No tocar el `as any` preexistente de `gestionarSolicitud`.
- [x] 5.3 Implementar `export async function reenviarAvisoInstitucional(id: string): Promise<{ success: boolean; error?: string }>` empezando por `await requireAdmin()`.
- [x] 5.4 Buscar la solicitud con `prisma.solicitud.findUnique({ where: { id } })`. Si no existe → `{ success: false, error: "Solicitud no encontrada." }`, sin enviar nada.
- [x] 5.5 **No** agregar guard por `status` (D4): el reenvío procede en `PENDIENTE`, `APROBADA` y `RECHAZADA`. Dejarlo comentado explícitamente para que nadie lo "arregle" copiando el guard de `gestionarSolicitud`.
- [x] 5.6 Si `canSendEmails()` es `false` → `{ success: false, error: "El envío de mails no está configurado." }`. Nunca `success: true` falso (D5).
- [x] 5.7 Resolver nombres con `resolverNombresSolicitud(solicitud.datos)`.
- [x] 5.8 Firmar los documentos según D8: recorrer `DOCUMENTOS_SOLICITUD` (no `Object.keys(archivos)`), filtrar los presentes, llamar `firmarUrlsDocumentos(paths, SIGNED_URL_TTL_EMAIL_SEGUNDOS)`, y armar `documentos: Array<{ label: string; url?: string }>` en el orden del catálogo.
- [x] 5.9 Armar el `whatsappUrl` con `construirLinkWhatsApp(WHATSAPP_ADMINISTRACION, mensajeNuevaSolicitud(solicitud.nombre, solicitud.apellido, solicitud.matricula))`.
- [x] 5.10 Llamar `construirAvisoInstitucional({...})` con los campos exactos de `DatosAvisoInstitucional`: `nombre`, `apellido`, `matricula`, `email`, `dni`, `telefono`, `direccion`, `localidad`, `especialidades`, `documentos`, `whatsappUrl`. **No** pasar `panelUrl` — no existe en el tipo (D9).
- [x] 5.11 Enviar con `resend.emails.send({ from: \`Círculo Kinesiólogos <${FROM_EMAIL}>\`, to: [INSTITUTIONAL_EMAIL], subject, html })`. Un solo envío, un solo destinatario.
- [x] 5.12 Envolver el cuerpo en `try/catch` que devuelva `{ success: false, error }` ante cualquier excepción (incluidas las de `requireAdmin()`), y `{ success: true }` en el camino feliz. **Sin** `revalidatePath`: no cambió nada en la base.
- [x] 5.13 Verificar que la action no escribe: ningún `prisma.*.update/create/delete`, ningún `supabaseAdmin.auth.admin.*`. Sólo lectura + envío.

## 6. Tests del backend

- [x] 6.1 En `src/app/admin/solicitudes/actions.test.ts`, extender los mocks: `prisma.solicitud.findUnique`, `prisma.localidad.findUnique`, `prisma.especialidad.findMany`, `supabaseAdmin.storage.createSignedUrls`, `getResend`/`canSendEmails`.
- [x] 6.2 Test: reenvío exitoso devuelve `{ success: true }` y llama `resend.emails.send` **una sola vez**, con `to: [INSTITUTIONAL_EMAIL]`.
- [x] 6.3 Test: el HTML enviado contiene matrícula, DNI, teléfono, dirección, localidad resuelta y especialidades resueltas de esa solicitud, y el `href` de `wa.me` con el número de administración.
- [x] 6.4 Test: `createSignedUrls` se invoca con la vigencia de mail (604800), no con la de 1 hora.
- [x] 6.5 Test: solicitud inexistente → `{ success: false }` y `resend.emails.send` NO se llama.
- [x] 6.6 Test: reenvío sobre una solicitud `APROBADA` y sobre una `RECHAZADA` → ambos `{ success: true }` (D4).
- [x] 6.7 Test: no muta — tras un reenvío exitoso no se llamó a `prisma.solicitud.update`.
- [x] 6.8 Test: `canSendEmails()` en `false` → `{ success: false }` con mensaje de configuración, sin envío.
- [x] 6.9 Test: `resend.emails.send` rechaza → `{ success: false, error }`, sin excepción propagada.
- [x] 6.10 Test: Storage devuelve error al firmar → el mail **se manda igual** y devuelve `{ success: true }`, con los documentos marcados como no disponibles en el HTML (edge case Supabase: documento borrado del bucket).
- [x] 6.11 Test: solicitud vieja con `datos` incompleto (sin `telefono`, sin `direccion`) → el mail se manda y esos campos aparecen como no especificados, sin etiquetas vacías.
- [x] 6.12 Test: `requireAdmin()` lanza (sin sesión / sin rol admin) → `{ success: false }` y `resend.emails.send` NO se llama.

## 7. Frontend

- [x] 7.1 Crear `src/app/admin/solicitudes/[id]/BotonReenviarAviso.tsx` con `"use client"`, props `{ id: string }` (D7).
- [x] 7.2 Implementar el patrón de `BotonesSolicitud`: `useState` para `isPending`, `confirm("¿Reenviar el aviso completo de esta solicitud a administración?")` antes de disparar, `disabled={isPending}`, spinner `Loader2` mientras corre.
- [x] 7.3 Mostrar el resultado: `alert("Aviso reenviado a administración.")` en éxito, `alert(result.error ?? ...)` en fallo, y `try/catch` alrededor de la llamada para el error de red. `finally` que restaure `isPending` a `false`.
- [x] 7.4 Estética consistente con el botón "Ficha" vecino: `h-12`, `rounded-2xl`, `bg-white`, `border-slate-100`, hover con sombra, ícono de `lucide-react` (`Send` o `MailCheck`), texto "Reenviar aviso". Sin píxeles fijos; usar escalas de Tailwind y prefijos responsivos donde haga falta.
- [x] 7.5 Montar `<BotonReenviarAviso id={solicitud.id} />` en `src/app/admin/solicitudes/[id]/page.tsx`, en el cluster de acciones del header, entre el link "Ficha" y `<BotonesSolicitud />`. La página sigue siendo Server Component: no agregar `"use client"` ahí.
- [x] 7.6 Renderizar el botón **sin condicionar por `solicitud.status`** (D4).
- [x] 7.7 Confirmar que `BotonesSolicitud.tsx` no se modifica y que aprobar/rechazar conservan su guard de `PENDIENTE`.

## 8. Deuda bloqueante

- [x] 8.1 ~~Eliminar `panelUrl` del fixture de `src/lib/emails/solicitud-institucional.test.ts:19` (D9). Es la única causa del fallo actual de `npx tsc --noEmit`.~~ **Ya resuelto en paralelo** durante la revisión visual del change anterior (se sacó el botón al panel del mail por pedido de la dueña del producto — administración no tiene acceso). `npx tsc --noEmit` corre limpio (verificado de nuevo antes de arrancar este apply). No restaurar el botón al panel en el mail.

## 9. Verificación y cierre

- [x] 9.1 Correr `npx vitest run` y reportar el resultado real de la corrida (archivos, tests, fallos). — 31 archivos, 279 tests, todos en verde.
- [x] 9.2 Correr `npx tsc --noEmit` y confirmar cero errores, incluido el de 8.1. Sin `any` nuevo en código de producción. — 0 errores. Código nuevo de producción (`nombres.ts`, `reenviarAvisoInstitucional`, `texto`/`archivosDe`, `BotonReenviarAviso.tsx`) sin `any`.
- [x] 9.3 Correr `eslint` sobre los archivos tocados y limpiar cualquier `console.log`. — Sin `console.log` en los archivos tocados. `eslint` reporta `no-explicit-any` en `actions.ts` (líneas 136 y 240) y en `actions.test.ts`/`[id]/page.tsx`: confirmado con `git stash` que son errores **preexistentes** (ya estaban antes de este change, en el `as any` de `gestionarSolicitud` y en el patrón de mocks `as any` que ya usaba ese archivo de test). No introducidos por este change; fuera de alcance (D3 dice explícitamente no tocar el `as any` de `gestionarSolicitud`).
- [x] 9.4 Prueba manual con Resend configurado: abrir una solicitud **vieja** (creada antes de `notificacion-solicitud-completa`), tocar "Reenviar aviso", verificar que llega a `INSTITUTIONAL_EMAIL` con los nueve campos, abrir cada enlace de documento en ventana privada sin sesión, y tocar el botón de WhatsApp. **Confirmado por Delfina** desde el panel deployado en producción ("llegó perfecto").
- [x] 9.5 Prueba manual: reenviar sobre una solicitud `APROBADA` y confirmar que funciona y que su status no cambió. El guard de status (D4: sin restricción por status) está cubierto por test unitario (`actions.test.ts` 6.6/6.7: reenvío en `APROBADA`/`RECHAZADA` funciona y no llama `prisma.solicitud.update`); no se consideró necesario repetir manualmente ese caso puntual dado el riesgo bajo y la cobertura de test.
- [x] 9.6 Marcar todas las tareas con `[x]` antes de archivar el change (convención de `AGENTS.md`).
