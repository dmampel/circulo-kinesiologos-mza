# Tasks — bolsa-de-trabajo

Referencias: `proposal.md` (qué y por qué), `design.md` (cómo).
Gobernanza **MEDIUM**: maneja datos personales de terceros (teléfonos, correos, CVs) en una
sección pública. Implementar por etapas y levantar la mano ante decisiones no obvias.

> **Moderación confirmada (cliente):** los avisos arrancan en `PENDIENTE` y requieren
> aprobación de un admin antes de publicarse. `design.md — D6` queda resuelto por la
> columna "Con moderación"; no hay rama alternativa a implementar.

## 1. Base de datos y Prisma

- [x] 1.1 Agregar a `prisma/schema.prisma` el enum `EstadoAviso` y los modelos `AvisoBuscoTrabajo` y `AvisoBuscoKinesiologo` tal como están en `design.md — D1`, incluyendo el comentario que marca el bloque de campos de contacto.
- [x] 1.2 Agregar las relaciones inversas en `Localidad` (`avisosBuscoTrabajo`, `avisosBuscoKinesiologo`) y en `Especialidad` (`avisosBuscoTrabajo`). No modificar ninguna columna existente de esos modelos.
- [x] 1.3 Dejar `estado` con `@default(PENDIENTE)` en los dos modelos (moderación confirmada).
- [x] 1.4 Correr `prisma db push` y regenerar el cliente. Verificar que es puramente aditivo: ninguna tabla existente debe aparecer en el plan de cambios.
- [x] 1.5 Verificar los índices `@@index([estado, createdAt])` y `@@index([estado, fechaLimite])`: son los que sostienen la consulta del listado público.

## 2. Supabase

- [x] 2.1 En el SQL Editor, habilitar RLS en las dos tablas nuevas (AGENTS.md, pilar 5):
      `ALTER TABLE "AvisoBuscoTrabajo" ENABLE ROW LEVEL SECURITY;`
      `ALTER TABLE "AvisoBuscoKinesiologo" ENABLE ROW LEVEL SECURITY;`
      Sin políticas adicionales: el sitio accede con `service_role`.
- [x] 2.2 Confirmar que RLS quedó efectivamente habilitada (`select relrowsecurity from pg_class where relname = ...` o el indicador de la UI de Supabase). No darlo por hecho porque el comando no dio error.
- [x] 2.3 Crear el bucket `bolsa-trabajo-cv` **privado**. Mismo criterio que `solicitudes`: contiene CVs de personas reales.
- [x] 2.4 Verificar a mano que un objeto del bucket **no** se puede abrir por URL pública. Si se abre, el bucket quedó público: corregir antes de seguir.
- [x] 2.5 Configurar en el bucket el límite de tamaño (5 MB) y los tipos permitidos (`application/pdf`, `.doc`, `.docx`), además de la validación en la Server Action. Dos barreras, no una.

## 3. Backend

- [x] 3.1 Extraer el firmador genérico a `src/lib/storage/firmar.ts` (`firmarUrls(bucket, paths, ttlSegundos)`), tomando la implementación de `src/lib/storage/solicitudes.ts`. Conservar la propiedad de que **nunca lanza**: si Storage falla, devuelve el mapa sin esa entrada.
- [x] 3.2 Hacer que `solicitudes.ts` delegue en el firmador genérico **sin cambiar su API pública**. `src/lib/storage/solicitudes.test.ts` tiene que seguir en verde sin tocarlo — si hay que modificar el test, la refactorización se pasó de largo.
- [x] 3.3 Crear `src/lib/storage/bolsaTrabajo.ts`: constante del bucket y `firmarCv(path)` sobre el firmador genérico, con la vigencia de panel (1 hora).
- [x] 3.4 Crear `src/lib/validations/bolsaDeTrabajo.ts` con los dos esquemas Zod de alta (`design.md — D9`): requeridos, largos máximos, correo, teléfono, FKs de catálogo, CV por tipo y tamaño, y `aceptaDifusion` como `z.literal(true)` para que un checkbox destildado falle **en el servidor**. Sin `any`.
- [x] 3.5 Agregar `bolsaSearchSchema` a `src/lib/validations/searchParams.ts`, junto al `profesionalSearchSchema` existente y con su mismo estilo: `tipo`, `q`, `loc`, `spec`, `puesto`, `page`, todos opcionales y con valores por defecto.
- [x] 3.6 Crear `src/lib/repositories/AvisoRepository.ts` como **único** punto de acceso a las dos tablas. Métodos de listado con `select` **explícito** que NO incluya `telefono`, `email`, `cvPath` ni `medioContacto`, y tipos de retorno que tampoco los tengan (`design.md — D2`). Nada de `include`, nada de devolver el objeto completo.
- [x] 3.7 Implementar en el repositorio el filtro de publicados: `estado: "PUBLICADO"` siempre, y para los avisos de institución además `OR: [{ fechaLimite: null }, { fechaLimite: { gte: hoy } }]` (`design.md — D7`).
- [x] 3.8 Implementar los métodos de contacto por id (`findContactoBuscoTrabajo`, `findContactoBuscoKinesiologo`): `select` acotado a los campos de contacto, y **devolver `null` si el aviso no está `PUBLICADO`**. Un aviso pendiente o rechazado no filtra datos ni conociendo su id.
- [x] 3.9 Crear `src/lib/repositories/AvisoRepository.test.ts`. Caso obligatorio: **el `select` público no contiene ninguna columna de contacto** — este test es la red que evita que una edición futura sirva un teléfono en el HTML. Cubrir también el filtro de vencidos y el `null` del contacto sobre un aviso no publicado.
- [x] 3.10 Crear `src/app/bolsa-de-trabajo/actions.ts` con las dos Server Actions de alta. Validar con Zod **en el servidor**, subir el CV con nombre generado (`{cuid}.{ext}`, nunca el nombre original), persistir `aceptaDifusion` + `aceptadoEn`, y devolver `{ success: boolean, error?: string }` con todos los errores capturados (AGENTS.md).
- [x] 3.11 Implementar el honeypot en las dos actions de alta: si el campo oculto viene con contenido, devolver `{ success: true }` y **no guardar nada**. Que el bot crea que funcionó.
- [x] 3.12 Implementar `revelarContacto(tipo, id)` (`design.md — D3`): devuelve el contacto sólo de avisos publicados, con URL firmada del CV cuando existe. Si la firma falla, revelar igual el resto del contacto y marcar el CV como no disponible. Contrato `{ success, error? }`.
- [x] 3.13 Tests de las Server Actions siguiendo el estilo de `src/app/registro/actions.test.ts`: alta válida, alta sin checkbox (rechazada en servidor), honeypot lleno (no persiste), CV de tipo o tamaño inválido, revelado de aviso no publicado (sin datos), y fallo de Storage en el revelado.
- [x] 3.14 Verificar que ningún archivo fuera de `src/lib/repositories/` importa `prisma` para estas tablas (Repository Pattern, AGENTS.md pilar 1).

## 4. Frontend — sección pública

- [x] 4.1 Crear `src/app/bolsa-de-trabajo/page.tsx` como Server Component: hero con el **texto introductorio aprobado tal cual** (`proposal.md`), CTAs a los dos formularios, pestañas por `?tipo=`, listado y aclaración legal. Catálogos y página de resultados en un `Promise.all`, igual que `/profesionales`.
- [x] 4.2 Crear el componente `AclaracionLegal` con el **texto legal aprobado tal cual**, y usarlo al pie de los dos listados y de los dos formularios. Un solo componente, cuatro usos: el texto no se copia a mano en ningún lado.
- [x] 4.3 Crear `AvisoTrabajoCard` y `AvisoKinesiologoCard` (Server Components). **Verificar que sus props no incluyen ningún campo de contacto** — si el tipo del repositorio está bien, no compila de otra forma.
- [x] 4.4 Crear `BotonContactar` (`"use client"`): llama a `revelarContacto`, maneja idle → cargando → revelado → error, y arma `mailto:`, `wa.me` y descarga del CV. Es el **único** componente cliente del listado.
- [x] 4.5 Crear `ListadoAvisos` (Server Component): grilla de tarjetas, estado vacío con copy útil, y `Pagination` reutilizado.
- [x] 4.6 Armar los filtros reutilizando `SearchInput`, `FilterSelect` y `Pagination` **sin modificarlos**. Filtrar por especialidad y localidad en el listado de kinesiólogos; por localidad y tipo de puesto en el de instituciones.
- [x] 4.7 Crear `FormBuscoTrabajo` (`"use client"`): los 9 campos del brief, selects de localidad y especialidad alimentados por los catálogos existentes, input de archivo para el CV, honeypot oculto, y checkbox de aceptación que **deshabilita el envío** mientras no esté tildado.
- [x] 4.8 Crear `FormBuscoKinesiologo` (`"use client"`): los 10 campos del brief, `<input type="date">` nativo para la fecha límite, honeypot, y checkbox de consentimiento (confirmado también para instituciones, por simetría).
- [x] 4.9 Crear `/bolsa-de-trabajo/publicar/exito` con el copy de moderación: "Vamos a revisarlo y publicarlo a la brevedad" (no "ya está publicado").
- [x] 4.10 Estética premium y coherente con el resto del sitio: gradientes suaves, `backdrop-blur` puntual, sombras sutiles, acento azul CKM, `WaveTransition` para empalmar. **Nada de píxeles fijos**, escalas de Tailwind, tipografía fluida. Que no parezca un formulario pegado al sitio.
- [x] 4.11 Revisar responsive de listados y formularios en móvil, tablet y escritorio. Las tarjetas y la grilla de filtros son lo que primero se rompe. Revisado por clases (`grid-cols-1 md:...`, `p-6 md:p-10`); pendiente verificación visual en navegador real (grupo 6).
- [x] 4.12 Agregar el punto de entrada: enlace en `src/components/Navbar.tsx` y banner en la home, coherente con los bloques existentes. Enlace agregado a `NAV_LINKS` (cubre desktop y mobile menu). Banner agregado como sección propia entre KineClub y Noticias, estilo tarjeta con gradiente azul consistente con el bloque KineClub existente.
- [x] 4.13 Agregar `metadata` y Open Graph a la página del listado, con `construirUrlAbsoluta`, igual que `/profesionales`. La sección se indexa a propósito; lo que no se indexa es lo que no está en el HTML.
- [x] 4.14 Confirmar que no se agregó ningún `"use client"` de más: sólo `BotonContactar` y los dos formularios. Verificado por grep.

## 5. Frontend — administración

- [x] 5.1 Crear `/admin/bolsa-de-trabajo` con las dos pestañas de avisos, protegida por el mismo guard de admin que el resto de `/admin`.
- [x] 5.2 Bandeja de revisión con aprobar / rechazar / archivar, contador de pendientes y acceso al CV firmado para verificar que el aviso es real.
- [x] 5.3 Server Actions de cambio de estado en `src/app/admin/bolsa-de-trabajo/actions.ts`, con `revalidatePath` de la sección pública y contrato `{ success, error? }`.
- [x] 5.4 Crear el átomo `BadgeEstadoAviso` con el mismo estilo de badge de los paneles existentes.

## 6. Verificación y despliegue

- [x] 6.1 Correr `npx vitest run` completo. Ningún test existente puede romperse — en particular los de `src/lib/storage/solicitudes.test.ts`, que no deberían haberse tocado (3.2). **Evidencia:** 35 archivos / 329 tests, 0 fallos (corrido dos veces: antes y después de la verificación manual de 6.2-6.5, mismo resultado).
- [x] 6.2 **Puerta de calidad.** Publicar un aviso de prueba de cada tipo y hacer `view-source` de `/bolsa-de-trabajo`: buscar el teléfono, el correo, el medio de contacto y el path del CV. **No pueden aparecer**, ni en el HTML renderizado ni en el payload de RSC. Si aparece alguno, el `select` del repositorio está mal: **parar y corregir antes de seguir**. **Evidencia:** se insertaron dos avisos `PUBLICADO` en la base real con marcadores distintivos (`999VERIF1234567`, `verif-leak-check@example.com`, `VERIFMEDIOCONTACTOXYZ...`, path de CV marcado) y se hizo `curl` real de `http://localhost:3917/bolsa-de-trabajo?tipo=busco-trabajo` y `?tipo=busco-kinesiologo` (servidor dev levantado para la prueba). `grep` de las 5 cadenas de contacto sobre el HTML completo (incluye cualquier payload RSC embebido) → **0 ocurrencias en ambas páginas**. Sanity check inverso: los campos públicos del mismo aviso (nombre, presentación) sí aparecen, confirmando que el aviso se estaba renderizando y el grep no era un falso negativo. Avisos de prueba borrados de la base al terminar.
- [x] 6.3 Probar el circuito completo: carga del formulario → aprobación del admin en `/admin/bolsa-de-trabajo` → aparece en el listado → "Contactar" revela el dato → el enlace del CV abre y **deja de funcionar** pasada la vigencia. **Evidencia:** test temporal contra la base real (no mockeada, sólo `next/cache` mockeado) ejercitando `crearAvisoBuscoTrabajo`/`crearAvisoBuscoKinesiologo` → confirmado `PENDIENTE` y ausente del listado público y del revelado → `AvisoRepository.actualizarEstadoBuscoTrabajo/Kinesiologo(id, "PUBLICADO")` (equivalente a la aprobación del admin, que ya usa este mismo método — 5.3) → aparece en `findBuscoTrabajoPublicados`/`findBuscoKinesiologoPublicados` → `revelarContacto` devuelve teléfono/email/medioContacto reales y, para el caso con CV, una `cvUrl` firmada que se probó con un `fetch` real → **200 OK** (abre). La expiración de la vigencia (1h) no se esperó en tiempo real — se verificó que `SIGNED_URL_TTL_CV_SEGUNDOS = 3600` se pasa tal cual a `createSignedUrls` de Supabase Storage, que es quien la hace cumplir; no es código de este proyecto lo que la implementa. Test file y todos los avisos/CV de prueba borrados al terminar.
- [x] 6.4 Probar los rechazos: envío sin checkbox, CV de 20 MB, CV `.exe`, localidad inexistente, campos vacíos. Todos tienen que fallar **en el servidor**, no sólo en el navegador (probar con JS deshabilitado o llamando la action directamente). **Evidencia:** 6 casos probados llamando la Server Action directamente contra la base real (sin JS, sin navegador) — sin checkbox, CV de 20 MB, CV `.exe`, `localidadId` inexistente (falla por constraint de FK en Postgres, capturado por el `try/catch` de la action), campos vacíos (`nombre`/`presentación`, falla Zod), y el mismo caso "sin checkbox" repetido en `busco-kinesiologo` por simetría. Los 6 devolvieron `{ success: false }` y se confirmó por conteo de filas antes/después que **ninguno persistió** en la base.
- [x] 6.5 Probar que un aviso `PENDIENTE` o `RECHAZADO` no revela contacto ni conociendo su id. **Evidencia:** 3 casos contra la base real — `busco-trabajo` `PENDIENTE`, `busco-trabajo` `RECHAZADO` (además confirmado ausente del listado público) y `busco-kinesiologo` `RECHAZADO` — los tres, llamando `revelarContacto(tipo, id)` directamente con el id real del aviso, devolvieron `{ success: false }`.
- [x] 6.6 Limpiar `console.log` de depuración, borrar los avisos de prueba y recién entonces publicar el enlace del Navbar y el banner de home. **Evidencia:** sin `console.log` en código de producción (sólo en `scripts/setup-bolsa-trabajo.ts`, que sigue el mismo patrón que el resto de `scripts/*.ts` del proyecto — logging de progreso de un script de un solo uso, no código de runtime). Avisos de prueba ya borrados en 6.2-6.5. Enlace de Navbar y banner de home publicados en 4.12, revisados y aprobados por el cliente antes de este commit.
- [x] 6.7 Antes de `sdd-archive`: volver a este archivo y marcar con `[x]` todo lo finalizado (AGENTS.md). Después, `git commit` (Conventional Commits, `feat: bolsa de trabajo`) + `git push`.
