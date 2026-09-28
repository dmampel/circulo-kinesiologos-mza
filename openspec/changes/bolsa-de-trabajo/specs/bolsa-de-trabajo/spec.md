## ADDED Requirements

### Requirement: Alta de aviso "Busco trabajo" con validación en servidor

El formulario público de kinesiólogo que busca trabajo SHALL enviarse a una Server Action que valida todos los campos con Zod **en el servidor**, sin sesión ni login previos. La validación de cliente SHALL ser comodidad de UX, no control: un envío que la esquive (JS deshabilitado, llamada directa a la action) SHALL fallar igual del lado del servidor si los datos no cumplen el esquema.

El checkbox de aceptación de difusión (`aceptaDifusion`) SHALL validarse con `z.literal(true)`: un envío sin el checkbox tildado SHALL ser rechazado por el servidor, no sólo deshabilitado en el botón del formulario. Cuando el envío es válido, el sistema SHALL persistir `aceptaDifusion: true` junto a `aceptadoEn` con el timestamp del momento de la carga, como registro del consentimiento.

El CV adjunto SHALL validarse por tipo (`application/pdf`, `.doc`, `.docx`) y tamaño (máximo 5 MB) en el servidor. El objeto SHALL guardarse en el bucket privado `bolsa-trabajo-cv` con un nombre generado (`{cuid}.{ext}`); el nombre original del archivo subido NO SHALL usarse como nombre del objeto.

Todo aviso nuevo SHALL persistirse con `estado: PENDIENTE` (ver moderación).

#### Scenario: Alta válida con CV

- **GIVEN** un visitante sin sesión que completa el formulario "Busco trabajo" con todos los campos requeridos, tilda el checkbox de aceptación y adjunta un PDF de 2 MB
- **WHEN** envía el formulario
- **THEN** la Server Action SHALL validar los datos con Zod y SHALL aceptarlos
- **AND** SHALL persistir el aviso con `estado: PENDIENTE`, `aceptaDifusion: true` y `aceptadoEn` con el timestamp del envío
- **AND** SHALL guardar el CV en el bucket privado con un nombre generado, no el nombre original del archivo
- **AND** SHALL devolver `{ success: true }`

#### Scenario: Envío sin tildar el checkbox de aceptación

- **GIVEN** un envío del formulario "Busco trabajo" con todos los campos completos pero sin tildar el checkbox de aceptación de difusión
- **WHEN** la Server Action valida el payload, incluso si el envío se hizo con JavaScript deshabilitado o llamando la action directamente
- **THEN** la validación de `aceptaDifusion` con `z.literal(true)` SHALL fallar
- **AND** el sistema NO SHALL persistir ningún aviso
- **AND** SHALL devolver `{ success: false, error }`

#### Scenario: CV de tipo o tamaño inválido

- **GIVEN** un envío del formulario "Busco trabajo" con un archivo adjunto `.exe` o un PDF de 20 MB
- **WHEN** la Server Action valida el archivo
- **THEN** SHALL rechazar el envío en el servidor
- **AND** NO SHALL subir el archivo al bucket
- **AND** NO SHALL persistir ningún aviso

#### Scenario: Campos requeridos ausentes o localidad/especialidad inexistente

- **GIVEN** un envío con un campo de texto requerido vacío, o con un `localidadId`/`especialidadId` que no existe en el catálogo
- **WHEN** la Server Action valida el payload
- **THEN** SHALL rechazar el envío con `{ success: false, error }`
- **AND** NO SHALL persistir ningún aviso

---

### Requirement: Alta de aviso "Busco kinesiólogo" con validación en servidor

El formulario público de institución que busca kinesiólogo SHALL seguir el mismo tratamiento de validación en servidor que "Busco trabajo": esquema Zod propio, sin sesión, sin CV. Incluye checkbox de aceptación de difusión (`aceptaDifusion`) con el mismo `z.literal(true)` y el mismo registro de `aceptadoEn`, por simetría con el formulario de kinesiólogo: el medio de contacto de una institución suele ser el celular de una persona.

La `fechaLimite` (fecha límite para postularse) SHALL ser opcional. Todo aviso nuevo SHALL persistirse con `estado: PENDIENTE`.

#### Scenario: Alta válida sin fecha límite

- **GIVEN** un envío del formulario "Busco kinesiólogo" con todos los campos requeridos, checkbox de aceptación tildado, y sin completar la fecha límite
- **WHEN** la Server Action valida el payload
- **THEN** SHALL aceptarlo
- **AND** SHALL persistir el aviso con `estado: PENDIENTE`, `fechaLimite: null`, `aceptaDifusion: true` y `aceptadoEn`

#### Scenario: Envío sin checkbox de aceptación

- **GIVEN** un envío del formulario "Busco kinesiólogo" sin tildar el checkbox de aceptación de difusión
- **WHEN** la Server Action valida el payload
- **THEN** SHALL rechazarlo en el servidor
- **AND** NO SHALL persistir ningún aviso

---

### Requirement: Honeypot antispam en las dos altas

Cada Server Action de alta SHALL incluir un campo honeypot oculto. Si ese campo llega con contenido, el sistema SHALL asumir que el envío es de un bot.

#### Scenario: Honeypot completado

- **GIVEN** un envío a cualquiera de las dos Server Actions de alta con el campo honeypot no vacío
- **WHEN** la Server Action lo procesa
- **THEN** el sistema NO SHALL persistir ningún aviso
- **AND** SHALL devolver `{ success: true }` igualmente, sin indicar que fue descartado

---

### Requirement: Moderación — los avisos nuevos requieren aprobación antes de publicarse

Todo aviso nuevo (de cualquiera de los dos tipos) SHALL crearse con `estado: PENDIENTE`. NO SHALL aparecer en el listado público mientras esté en ese estado. Un administrador SHALL poder aprobarlo (pasa a `PUBLICADO`), rechazarlo (pasa a `RECHAZADO`) o, más adelante, archivarlo (pasa a `ARCHIVADO`) desde `/admin/bolsa-de-trabajo`.

La pantalla de moderación SHALL estar protegida por el mismo guard de sesión de administrador que el resto de `/admin`. Las Server Actions de cambio de estado SHALL devolver `{ success: boolean, error?: string }` y SHALL revalidar la ruta pública del listado tras un cambio exitoso, para que la aprobación se refleje sin esperar la próxima recarga natural de caché.

#### Scenario: Aviso recién creado no aparece en el listado público

- **GIVEN** un aviso recién persistido con `estado: PENDIENTE`
- **WHEN** un visitante carga `/bolsa-de-trabajo`
- **THEN** ese aviso NO SHALL aparecer en el listado

#### Scenario: Aprobación de un aviso pendiente

- **GIVEN** un aviso con `estado: PENDIENTE` visible en la bandeja de `/admin/bolsa-de-trabajo`
- **WHEN** un administrador lo aprueba
- **THEN** el sistema SHALL cambiar su `estado` a `PUBLICADO`
- **AND** SHALL revalidar la ruta pública del listado
- **AND** el aviso SHALL aparecer en `/bolsa-de-trabajo` en la siguiente carga

#### Scenario: Rechazo de un aviso pendiente

- **GIVEN** un aviso con `estado: PENDIENTE`
- **WHEN** un administrador lo rechaza
- **THEN** el sistema SHALL cambiar su `estado` a `RECHAZADO`
- **AND** el aviso NO SHALL aparecer nunca en el listado público
- **AND** la Server Action de revelado de contacto NO SHALL devolver datos para ese aviso, aunque se conozca su id

#### Scenario: Acceso a la bandeja de moderación sin sesión de administrador

- **GIVEN** una petición a `/admin/bolsa-de-trabajo` sin sesión autenticada o con una sesión sin rol de administrador
- **WHEN** llega al servidor
- **THEN** SHALL rechazarse con el mismo guard que el resto de `/admin`
- **AND** NO SHALL exponer ningún dato de los avisos pendientes

---

### Requirement: El listado público sólo expone campos no sensibles

El repositorio SHALL usar `select` explícito para los métodos de listado público (`findBuscoTrabajoPublicados`, `findBuscoKinesiologoPublicados`), y ese `select` NO SHALL incluir `telefono`, `email`, `cvPath` ni `medioContacto`. Los tipos de retorno de esos métodos NO SHALL declarar esos campos: un componente que reciba ese tipo no puede filtrar el dato de contacto por descuido, porque el compilador no lo permite.

Los métodos de listado público SHALL filtrar siempre por `estado: PUBLICADO`. Para `AvisoBuscoKinesiologo`, además, SHALL excluir los avisos cuya `fechaLimite` ya pasó (`fechaLimite: null` o `fechaLimite >= hoy`). El listado SHALL soportar filtros por especialidad, localidad y tipo de puesto, y paginado, siguiendo el patrón `searchParams` + Zod + Server Component de `/profesionales`.

#### Scenario: El HTML servido no contiene datos de contacto

- **GIVEN** al menos un aviso `PUBLICADO` de cada tipo
- **WHEN** se hace `view-source` de `/bolsa-de-trabajo`
- **THEN** el HTML (incluido el payload de RSC) NO SHALL contener el teléfono, el correo, el medio de contacto ni el path del CV de ningún aviso

#### Scenario: Avisos pendientes o rechazados no aparecen aunque existan

- **GIVEN** avisos en estado `PENDIENTE` y `RECHAZADO` junto con avisos `PUBLICADO`
- **WHEN** se consulta el listado público
- **THEN** SHALL devolver únicamente los avisos con `estado: PUBLICADO`

#### Scenario: Aviso de institución con fecha límite vencida

- **GIVEN** un aviso `AvisoBuscoKinesiologo` en `estado: PUBLICADO` con `fechaLimite` anterior a hoy
- **WHEN** se consulta el listado público
- **THEN** ese aviso NO SHALL aparecer en los resultados

#### Scenario: Filtrado por especialidad y localidad

- **GIVEN** varios avisos `PUBLICADO` de kinesiólogos con distintas especialidades y localidades
- **WHEN** se consulta el listado con un filtro de especialidad y localidad específicos
- **THEN** SHALL devolver sólo los avisos que coinciden con ambos criterios

---

### Requirement: Revelado de contacto bajo demanda, sólo para avisos publicados

El dato de contacto SHALL obtenerse exclusivamente mediante la Server Action `revelarContacto(tipo, id)`, invocada por el botón "Contactar" al hacer click. Esa action SHALL usar un `select` acotado a los campos de contacto del aviso solicitado, y SHALL devolver datos únicamente si el aviso está en `estado: PUBLICADO`. Para cualquier otro estado (`PENDIENTE`, `RECHAZADO`, `ARCHIVADO`) o para un id inexistente, la action NO SHALL revelar ningún dato de contacto.

Cuando el aviso es de tipo "Busco trabajo" y tiene CV, la action SHALL generar en ese momento una URL firmada de vida corta (no reutilizar una firma anterior). Si la firma falla, el resto del contacto SHALL revelarse igual y el CV SHALL marcarse como no disponible: la action NO SHALL lanzar ni fallar por completo por un error de Storage.

#### Scenario: Revelado de contacto de un aviso publicado

- **GIVEN** un aviso `AvisoBuscoTrabajo` en `estado: PUBLICADO` con CV cargado
- **WHEN** un visitante hace click en "Contactar" y se invoca `revelarContacto("busco-trabajo", id)`
- **THEN** la action SHALL devolver `{ success: true, contacto }` con teléfono, correo y una URL firmada del CV recién generada

#### Scenario: Intento de revelar contacto de un aviso no publicado

- **GIVEN** un aviso con `estado: PENDIENTE` o `estado: RECHAZADO`
- **WHEN** se invoca `revelarContacto` con su id, aun conociéndolo de antemano
- **THEN** la action NO SHALL devolver ningún dato de contacto
- **AND** SHALL devolver `{ success: false, error }` o un resultado sin campos de contacto

#### Scenario: Fallo de Storage al firmar el CV

- **GIVEN** un aviso `PUBLICADO` con CV cargado
- **WHEN** se invoca `revelarContacto` y la firma de la URL del CV falla
- **THEN** la action SHALL devolver igual el teléfono y el correo
- **AND** SHALL marcar el CV como no disponible, sin lanzar una excepción no controlada

#### Scenario: Id inexistente

- **GIVEN** un id que no corresponde a ningún aviso
- **WHEN** se invoca `revelarContacto` con ese id
- **THEN** la action NO SHALL devolver datos de contacto
- **AND** SHALL devolver un resultado que indique que no hay contacto disponible

---

### Requirement: El repositorio es el único punto de acceso a los avisos

Ningún archivo fuera de `src/lib/repositories/AvisoRepository.ts` SHALL importar `prisma` para leer o escribir las tablas `AvisoBuscoTrabajo` o `AvisoBuscoKinesiologo`. El repositorio SHALL exponer dos familias de métodos que no se cruzan: los de listado público (sin campos de contacto, tipo de retorno sin esos campos) y los de contacto por id (acotados a esos campos, sólo para avisos `PUBLICADO`). Ningún método SHALL usar `include` ni devolver el objeto completo de Prisma.

#### Scenario: El select público no contiene columnas de contacto

- **GIVEN** el método `findBuscoTrabajoPublicados` o `findBuscoKinesiologoPublicados` del repositorio
- **WHEN** se inspecciona su cláusula `select`
- **THEN** NO SHALL incluir `telefono`, `email`, `cvPath` ni `medioContacto`

#### Scenario: Acceso a datos fuera del repositorio

- **GIVEN** el código del proyecto fuera de `src/lib/repositories/AvisoRepository.ts`
- **WHEN** se busca un import de `prisma` referido a `AvisoBuscoTrabajo` o `AvisoBuscoKinesiologo`
- **THEN** NO SHALL encontrarse ninguno

---

### Requirement: Las dos tablas nuevas tienen Row-Level Security habilitada

`AvisoBuscoTrabajo` y `AvisoBuscoKinesiologo` SHALL tener RLS habilitada en Supabase inmediatamente después de crearse con `prisma db push`, sin políticas adicionales (el sitio accede con `service_role`, que bypasea RLS).

#### Scenario: Verificación de RLS tras el `db push`

- **GIVEN** las tablas `AvisoBuscoTrabajo` y `AvisoBuscoKinesiologo` recién creadas
- **WHEN** se consulta su estado de RLS en Supabase
- **THEN** ambas SHALL tener RLS habilitada
