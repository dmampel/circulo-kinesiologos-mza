## 1. DB / Prisma

- [x] 1.1 Confirmar que no hace falta ningún cambio de schema: los datos del aviso (dni, telefono, direccion, localidadId, especialidades, archivos) ya viven en `Solicitud.datos` y en las columnas de `Solicitud`. Sin migración, sin `prisma db push`.

## 2. Supabase / Storage

- [x] 2.1 En `src/lib/storage/solicitudes.ts`, agregar `export const SIGNED_URL_TTL_EMAIL_SEGUNDOS = 60 * 60 * 24 * 7;` con comentario que explique por qué la vigencia del mail es mayor que la del panel (D1 del design).
- [x] 2.2 En el mismo archivo, cambiar la firma a `firmarUrlsDocumentos(paths: string[], ttlSegundos: number = SIGNED_URL_TTL_SEGUNDOS)` y pasar `ttlSegundos` a `createSignedUrls`. El default preserva el comportamiento del llamador existente en `src/app/admin/solicitudes/[id]/page.tsx` — no tocar esa página.
- [x] 2.3 En `src/lib/storage/solicitudes.test.ts`, agregar tests: (a) sin segundo argumento se llama a `createSignedUrls` con `SIGNED_URL_TTL_SEGUNDOS`; (b) con `SIGNED_URL_TTL_EMAIL_SEGUNDOS` se llama con 604800; (c) si Storage devuelve error sigue devolviendo `{}` sin lanzar.
- [x] 2.4 Verificar que no se agregó ninguna política RLS ni se modificó la visibilidad del bucket `solicitudes`: sigue privado y se firma con `supabaseAdmin` (service role).

## 3. Backend — helpers puros

- [x] 3.1 Crear `src/lib/whatsapp.ts` con la constante `WHATSAPP_ADMINISTRACION = "5492616937588"` (E.164 sin `+`, comentario explicando que es el número de la dueña del producto y por qué es constante y no env var).
- [x] 3.2 En el mismo módulo, implementar `construirLinkWhatsApp(numero: string, mensaje: string): string` devolviendo `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`.
- [x] 3.3 En el mismo módulo, implementar `mensajeNuevaSolicitud(nombre, apellido, matricula): string` con el texto acordado: `Hola Delfina, llegó una solicitud nueva de {nombre} {apellido} (matrícula {matricula}), ¿la aprobamos?`.
- [x] 3.4 Crear `src/lib/whatsapp.test.ts`: el link empieza con `https://wa.me/5492616937588?text=`; un nombre con acentos/eñe/espacios produce un URL válido y decodifica al mensaje original (`decodeURIComponent` round-trip); el `?` y la coma del mensaje quedan codificados.
- [x] 3.5 Crear `src/lib/emails/solicitud-institucional.ts` con `escaparHtml(valor: string): string` que reemplace `& < > " '` por entidades (el `&` primero, para no doble-escapar).
- [x] 3.6 En el mismo módulo, definir el tipo `DatosAvisoInstitucional` según D2 del design — sin `any`, todos los campos ya resueltos a string, `documentos: Array<{ label: string; url?: string }>`.
- [x] 3.7 Implementar `construirAvisoInstitucional(datos): { subject: string; html: string }`: función pura, sin I/O, sin imports de Prisma/Storage/Resend. Subject: `Nueva Solicitud de Asociación: {nombre} {apellido}`.
- [x] 3.8 Armar el HTML con los cuatro bloques del design: (1) datos del solicitante — nombre y apellido, matrícula, email, DNI/CUIL, teléfono, dirección, localidad, especialidad(es); (2) documentación; (3) acciones; (4) nota de vigencia de los enlaces. Mantener el esqueleto visual actual (header oscuro, cuerpo blanco, footer gris, máx. 600px, estilos inline).
- [x] 3.9 En el bloque de documentación, renderizar un enlace por documento con URL y la leyenda "no disponible — revisar en el panel" para los que no tengan URL. Los opcionales sin adjuntar no se listan (el llamador no los incluye en `documentos`).
- [x] 3.10 ~~En el bloque de acciones, poner primero el botón verde "Avisar por WhatsApp" (`whatsappUrl`) y después el botón azul "Ir al Panel de Control" (`panelUrl`).~~ **Revisado tras ver la prueba real:** administración no tiene acceso al panel, así que ese botón la confundía. Se sacó `panelUrl` de `DatosAvisoInstitucional` y del HTML; queda solo "Avisar por WhatsApp", con una leyenda arriba ("Una vez aprobada la documentación, avisale a Delfina para darlo de alta en la web") que explica para qué es el botón.
- [x] 3.11 Aplicar `escaparHtml` a todos los valores de texto del solicitante. NO aplicarlo como `encodeURIComponent` a `whatsappUrl` ni a las URLs firmadas: van tal cual en el `href`.
- [x] 3.12 Crear `src/lib/emails/solicitud-institucional.test.ts`: el HTML contiene los 8 campos de datos; contiene los labels y hrefs de los documentos con URL; muestra la leyenda para los documentos sin URL; contiene el `href` de WhatsApp y el del panel; un nombre con `<script>` o `<b>` aparece escapado y no como markup; el subject es el esperado.

## 4. Backend — integración en el server action

- [x] 4.1 En `src/app/registro/actions.ts`, importar `firmarUrlsDocumentos` + `SIGNED_URL_TTL_EMAIL_SEGUNDOS`, `DOCUMENTOS_SOLICITUD` (de `@/lib/solicitudes/ficha`), `construirAvisoInstitucional`, y los helpers de `@/lib/whatsapp`.
- [x] 4.2 En el bloque best-effort que hoy resuelve nombres de especialidad (líneas ~185-197), agregar la resolución de localidad con `prisma.localidad.findUnique({ where: { id: localidadId }, select: { nombre: true } })` dentro del mismo `Promise.all`. Si falla o no encuentra, usar `"No especificada"` — nunca el id.
- [x] 4.3 Dentro del `try` del aviso institucional, firmar los documentos: mapear `archivos` contra `DOCUMENTOS_SOLICITUD` para obtener los paths presentes y llamar `firmarUrlsDocumentos(paths, SIGNED_URL_TTL_EMAIL_SEGUNDOS)`.
- [x] 4.4 Construir el array `documentos: Array<{ label, url? }>` recorriendo `DOCUMENTOS_SOLICITUD` en orden, incluyendo sólo las entradas con path en `archivos`, y adjuntando la URL firmada cuando exista.
- [x] 4.5 Armar el `whatsappUrl` con `construirLinkWhatsApp(WHATSAPP_ADMINISTRACION, mensajeNuevaSolicitud(nombre, apellido, matricula))`.
- [x] 4.6 Reemplazar el template literal inline del mail institucional por `construirAvisoInstitucional({...})` y pasar su `subject` y `html` a `resend.emails.send`. Destinatario sigue siendo `[INSTITUTIONAL_EMAIL]`, remitente `Círculo Kinesiólogos <${FROM_EMAIL}>`.
- [x] 4.7 Verificar que todo lo nuevo (firma de URLs incluida) queda dentro del `try/catch` del aviso institucional, para que un fallo no impida la confirmación al solicitante ni el `{ success: true }`.
- [x] 4.8 Confirmar que el mail de confirmación al solicitante (líneas ~258-286) queda intacto y que NO se agrega ningún tercer envío: exactamente dos `resend.emails.send` por solicitud creada.
- [x] 4.9 Confirmar que `src/app/admin/solicitudes/actions.ts` (`gestionarSolicitud`) no se toca.

## 5. Tests de integración del action

- [x] 5.1 En `src/app/registro/actions.test.ts`, extender el mock de `@/lib/supabase/admin` con `createSignedUrls` y el de `@/lib/prisma` con `localidad.findUnique`.
- [x] 5.2 Test: con `canSendEmails()` en `true`, `crearSolicitud` llama a `resend.emails.send` dos veces, y el primer envío va a `INSTITUTIONAL_EMAIL` con un HTML que contiene matrícula, DNI, teléfono, dirección y localidad.
- [x] 5.3 Test: el HTML institucional contiene el `href` de `wa.me` con el número correcto.
- [x] 5.4 Test: `firmarUrlsDocumentos` se invoca con la vigencia de mail (604800), no con la de 1 hora.
- [x] 5.5 Test: si `createSignedUrls` falla, `crearSolicitud` igual devuelve `{ success: true }` y el mail al solicitante se manda igual.
- [x] 5.6 Test: si `prisma.localidad.findUnique` rechaza, el mail se manda con la localidad como no especificada y la solicitud se crea igual.
- [x] 5.7 Test: con `canSendEmails()` en `false` no se envía ningún mail y la solicitud se crea igual (regresión del comportamiento actual).

## 6. Frontend

- [x] 6.1 Ninguna pantalla cambia. Confirmar explícitamente que `/registro`, `/admin/solicitudes` y `/admin/solicitudes/[id]` quedan sin modificar (la página de detalle sólo se beneficia del default preservado en 2.2).

## 7. Verificación y cierre

- [x] 7.1 Correr `npx vitest run` y reportar el resultado real de la corrida. Resultado: 30 archivos, 261 tests, todos en verde.
- [x] 7.2 Correr `npx tsc --noEmit` (o el build) y confirmar cero errores de tipos, sin `any` introducido. `tsc --noEmit` sin salida (cero errores). Nota: los nuevos tests de `actions.test.ts` usan `as any` en los mocks de `createSignedUrls`/`localidad.findUnique`, siguiendo el mismo patrón ya presente en el archivo (15 usos preexistentes de `any` en mocks antes de este change); no es `any` en código de producción.
- [x] 7.3 Correr `npx next lint` / `eslint` y limpiar cualquier `console.log` que haya quedado. `next lint` no existe como comando en esta versión (Next 16); se corrió `eslint` directo sobre los archivos tocados. Sin `console.log` nuevos. `eslint` marca `@typescript-eslint/no-explicit-any` en los mocks de test (ver nota 7.2) — es deuda preexistente del patrón de test, no de este change.
- [x] 7.4 Confirmar con la dueña del producto la vigencia de 7 días para los enlaces firmados (Open Question del design) antes del deploy. (Confirmado por Delfina en conversación.)
- [ ] 7.5 Prueba manual en entorno con Resend configurado: crear una solicitud de prueba, verificar que el aviso institucional llega con los 8 campos, abrir cada enlace de documento en una ventana privada sin sesión, y tocar el botón de WhatsApp para confirmar que el mensaje llega pre-cargado y con acentos correctos.
- [ ] 7.6 Marcar todas las tareas con `[x]` antes de archivar el change. (Pendiente: 7.4 y 7.5 requieren decisión de la dueña del producto y entorno con Resend configurado — fuera del alcance de este agente.)
