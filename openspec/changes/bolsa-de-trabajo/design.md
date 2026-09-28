## Context

Ver `proposal.md — Why` para la motivación. Las restricciones que condicionan la solución:

1. **Formularios públicos sin login.** No hay sesión, no hay usuario, no hay `Profesional` al que colgar el aviso. Todo lo que entra es texto declarado por un desconocido.
2. **El contacto es el producto y el riesgo a la vez.** La sección existe para que dos personas se contacten, y el dato que las conecta es justamente el que no puede quedar servido en el HTML. Todo lo demás se acomoda alrededor de esto.
3. **Los dos avisos casi no comparten campos.** De 9 y 10 campos respectivamente, sólo coinciden en localidad y en el texto libre. Modelarlos como uno solo obliga a ~14 columnas nulables y a ramificar cada lectura.
4. **Ya existe todo el andamiaje que hace falta.** `Localidad` y `Especialidad` son catálogos poblados; `solicitudes.ts` ya resuelve bucket privado + URL firmada; `/profesionales` ya resuelve listado con filtros por `searchParams` + Zod + paginado; `SearchInput`, `FilterSelect` y `Pagination` ya existen.
5. **La moderación fue confirmada por el cliente** (`proposal.md`): hay aprobación previa del admin. El `@default(PENDIENTE)` y la bandeja de `/admin/bolsa-de-trabajo` de D6 reflejan directamente esa decisión.

## Goals / Non-Goals

**Goals:**

- Que sea **estructuralmente imposible** que un dato de contacto viaje en la respuesta inicial de la página, no que "nos acordemos de ocultarlo".
- Que la decisión de moderación sea un valor por defecto, no una arquitectura.
- Reutilizar el patrón de listado de `/profesionales` en vez de inventar otro.
- Que la sección se sienta parte del sitio, no un formulario pegado.

**Non-Goals:**

- Verificar la matrícula contra el padrón. Es un dato declarado; validarlo abriría la puerta a "¿y si no está en el padrón?", que es una discusión de producto que el cliente no pidió.
- Construir un sistema de postulaciones. El contacto sale de la plataforma y ahí termina nuestra responsabilidad.
- Blindar el revelado de contacto contra un atacante dedicado. Se levanta la barrera del scraping automático masivo, que es la amenaza real.

## Decisions

### D1 — Dos modelos, no uno con discriminador

`AvisoBuscoTrabajo` y `AvisoBuscoKinesiologo` son tablas separadas. Un único `Aviso` con `tipo: TipoAviso` obligaría a que casi todas las columnas sean nulables, a que cada lectura ramifique, y a que el tipado no pueda garantizar que un aviso de institución tenga `tipoPuesto`. Dos modelos con campos requeridos donde corresponde dejan que el compilador haga el trabajo. El costo es duplicar el enum de estado y dos métodos de repositorio casi gemelos: es duplicación nominal, y se paga barato.

```prisma
enum EstadoAviso {
  PENDIENTE
  PUBLICADO
  RECHAZADO
  ARCHIVADO
}

model AvisoBuscoTrabajo {
  id        String @id @default(cuid())
  nombre    String
  apellido  String
  matricula String // declarada, NO verificada contra el padrón

  // --- Contacto: NUNCA se selecciona en consultas públicas (ver D2) ---
  telefono String
  email    String
  cvPath   String? // path dentro del bucket privado `bolsa-trabajo-cv`
  // -------------------------------------------------------------------

  especialidadId String
  especialidad   Especialidad @relation(fields: [especialidadId], references: [id])
  localidadId    String
  localidad      Localidad    @relation(fields: [localidadId], references: [id])
  zona           String? // texto libre complementario ("zona oeste", "Gran Mendoza")

  disponibilidad String
  presentacion   String

  aceptaDifusion Boolean  // siempre true: el form no envía sin tildarlo
  aceptadoEn     DateTime // registro del consentimiento

  estado    EstadoAviso @default(PENDIENTE) // ver D6
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@index([estado, createdAt])
}

model AvisoBuscoKinesiologo {
  id          String @id @default(cuid())
  institucion String // institución / consultorio / profesional

  localidadId String
  localidad   Localidad @relation(fields: [localidadId], references: [id])
  zona        String?

  area         String // área de trabajo (texto libre: no es la taxonomía de Especialidad)
  tipoPuesto   String
  diasHorarios String
  requisitos   String
  modalidad    String // modalidad de contratación
  propuesta    String // información sobre la propuesta

  // --- Contacto: NUNCA se selecciona en consultas públicas (ver D2) ---
  medioContacto String
  // -------------------------------------------------------------------

  fechaLimite DateTime? // fecha límite para postularse. Ver D7

  aceptaDifusion Boolean  // consentimiento explícito, igual que en AvisoBuscoTrabajo (confirmado, por simetría)
  aceptadoEn     DateTime

  estado    EstadoAviso @default(PENDIENTE)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@index([estado, fechaLimite])
}
```

A `Localidad` se le agregan las dos relaciones inversas y a `Especialidad` una. Ninguna columna existente cambia.

**Por qué FK a los catálogos y no texto libre:** `Localidad` y `Especialidad` ya están pobladas y curadas, y son exactamente las facetas por las que hay que filtrar. Texto libre daría "Godoy Cruz", "godoy cruz" y "Gdoy Cruz" como tres filtros distintos a la semana de publicado. El `select` del formulario se llena con `LocalidadRepository.getAll()` / `EspecialidadRepository.getAll()`, que ya existen. El campo `zona` libre cubre lo que el catálogo no expresa.

### D2 — El contacto no se oculta en la UI: no sale del repositorio

Esta es **la decisión central del change**. "No lo muestres en el componente" no alcanza: en un Server Component, todo lo que el servidor le pasa al cliente viaja en el payload de RSC dentro del HTML, esté renderizado o no. Un `{/* no mostramos el teléfono */}` con el objeto completo en props es un teléfono servido en texto plano.

`AvisoRepository` expone dos caminos que no se cruzan:

```ts
// Público: select explícito, SIN telefono/email/cvPath/medioContacto.
// El tipo de retorno no tiene esos campos: no se pueden filtrar por descuido.
findBuscoTrabajoPublicados(filtros, page): Promise<{ data: AvisoTrabajoPublico[]; total: number }>
findBuscoKinesiologoPublicados(filtros, page): Promise<{ data: AvisoKinesiologoPublico[]; total: number }>

// Contacto: select acotado a los campos de contacto de UN aviso, por id.
// Lo llama solamente la Server Action de revelado.
findContactoBuscoTrabajo(id): Promise<ContactoTrabajo | null>
findContactoBuscoKinesiologo(id): Promise<ContactoKinesiologo | null>
```

`select` explícito, nunca `include` ni objeto completo. La garantía es de tipos: el componente de listado recibe un tipo que **no tiene** campo `telefono`, así que no hay forma de filtrarlo sin editar el repositorio a propósito. Un test sobre el `select` público cierra el círculo.

**Alternativas descartadas:**

| Alternativa | Por qué no |
|---|---|
| Traer todo y ocultar con CSS / condicionales | Es el bug que este change evita. El dato está en el HTML igual |
| Ofuscar (rot13, base64, email en `data-` attribute) | Un scraper lo desarma en una línea. Seguridad por disfraz |
| Tabla separada `ContactoAviso` | El mismo efecto que un `select` disciplinado, a cambio de un join y dos tablas más. La frontera es la consulta, no el almacenamiento |
| Login obligatorio para ver contacto | El cliente pidió una bolsa abierta. Convierte la sección en un portal cerrado y mata el uso |

### D3 — El revelado es una Server Action, no una API route

```ts
// src/app/bolsa-de-trabajo/actions.ts
"use server";
export async function revelarContacto(
  tipo: "busco-trabajo" | "busco-kinesiologo",
  id: string,
): Promise<{ success: true; contacto: ContactoPublicable } | { success: false; error: string }>
```

Devuelve el objeto `{ success, error? }` que manda AGENTS.md. Para `busco-trabajo` incluye teléfono, correo y —si hay CV— una URL firmada recién generada. Para `busco-kinesiologo`, el medio de contacto.

**Por qué Server Action y no API route:** el proyecto ya hace todo por Server Actions, no hay `route.ts` de datos que imitar, y una API route sería un endpoint `GET /api/...` con un `id` en la URL, o sea justo lo que un bot enumera. La Server Action es un POST con un identificador de acción generado en build, que no aparece en el HTML de la página ni figura en ningún sitemap.

**El techo, dicho de frente:** esto no es autorización, es fricción. Quien inspeccione el bundle puede llamarla en bucle con los ids del listado. Lo que se elimina es el scraping trivial y la indexación por buscadores, que es el 99% del riesgo real en un sitio institucional con decenas de avisos. Si alguna vez aparece abuso, el upgrade es límite de tasa por IP en la action; no hace falta hoy.

El aviso **debe estar `PUBLICADO`** para que la action devuelva contacto. Un aviso pendiente o rechazado no filtra datos ni conociendo su id.

### D4 — CV: bucket privado y firma reutilizando lo que ya existe

Bucket `bolsa-trabajo-cv`, **privado**, igual que `solicitudes`. Nunca `getPublicUrl`. La URL se firma dentro de `revelarContacto`, con la vigencia de panel que ya está definida (1 hora).

`src/lib/storage/solicitudes.ts` ya tiene exactamente esta lógica, atada al bucket `solicitudes`. En vez de copiarla, se extrae el firmador genérico a `src/lib/storage/firmar.ts` (`firmarUrls(bucket, paths, ttl)`), y `solicitudes.ts` pasa a delegar **conservando su API pública y su suite de tests intactas**. El módulo nuevo de la bolsa son cuatro líneas sobre el firmador. Se mantiene la propiedad que ya tiene el original: no lanza nunca; si Storage falla, el CV se reporta como no disponible y el resto del contacto igual se revela.

Validación del archivo en el servidor con Zod: whitelist `application/pdf`, `.doc`, `.docx`, y tamaño máximo 5 MB. El nombre del objeto se genera (`{cuid}.{ext}`), nunca se usa el nombre original del archivo subido.

### D5 — Listado: el patrón de `/profesionales`, sin inventar nada

Una sola ruta `/bolsa-de-trabajo` con Server Component, dos pestañas por `searchParams` (`?tipo=busco-trabajo|busco-kinesiologo`), filtros y paginado por URL. Esquema `bolsaSearchSchema` en `src/lib/validations/searchParams.ts`, junto al `profesionalSearchSchema` que ya vive ahí. Los catálogos de filtros y la página de resultados se piden en paralelo con `Promise.all`, igual que en `/profesionales`.

Rutas:

| Ruta | Tipo | Qué es |
|---|---|---|
| `/bolsa-de-trabajo` | Server Component | Intro + pestañas + listados + aclaración legal |
| `/bolsa-de-trabajo/publicar/busco-trabajo` | Server Component + form cliente | Formulario del kinesiólogo |
| `/bolsa-de-trabajo/publicar/busco-kinesiologo` | Server Component + form cliente | Formulario de la institución |
| `/bolsa-de-trabajo/publicar/exito` | Server Component | Confirmación: "Vamos a revisarlo y publicarlo a la brevedad" |
| `/admin/bolsa-de-trabajo` | Server Component | Bandeja de moderación: aprobar / rechazar / archivar |

La página del listado **sí** se indexa: que Google encuentre las búsquedas es el objetivo de la sección. Lo que no se indexa es lo que no está en el HTML.

### D6 — Moderación confirmada: aprobación previa del admin

El cliente confirmó moderación con aprobación previa. `estado` arranca en `PENDIENTE` (`@default`), y sólo pasa a `PUBLICADO` cuando un admin lo aprueba en `/admin/bolsa-de-trabajo` (bandeja de revisión: aprobar / rechazar / archivar). El copy de `/publicar/exito` es "Vamos a revisarlo y publicarlo a la brevedad".

El campo `estado` se modeló como valor, no como rama de arquitectura, a propósito: modelos, repositorio, listado público y revelado de contacto son los mismos con o sin moderación, y el listado público siempre filtra por `estado: "PUBLICADO"`. Eso es lo que permitió no bloquear el arranque — los grupos 1 a 3 de `tasks.md` se implementaron sin esperar esta respuesta.

### D7 — Vencimiento: un filtro en la consulta, cero infraestructura

Los avisos de institución con `fechaLimite` pasada se excluyen del listado con `OR: [{ fechaLimite: null }, { fechaLimite: { gte: hoy } }]`. Sin cron, sin job, sin columna derivada que mantener sincronizada. El aviso sigue en la base y el admin lo ve; simplemente deja de estar en la vidriera.

Los avisos de kinesiólogo no tienen fecha y no caducan solos: los archiva el admin. Es la opción conservadora —nadie quiere que se le caiga la búsqueda de trabajo sin avisar— y fue confirmada con el cliente.

### D8 — Desglose de UI (Atomic Design)

Estética premium del resto del sitio: gradientes suaves, `backdrop-blur` puntual, sombras sutiles, acento azul CKM. Escalas de Tailwind, sin píxeles fijos, tipografía fluida (`text-4xl md:text-6xl` en el hero), `WaveTransition` para empalmar con el resto de las páginas públicas.

| Nivel | Componente | Detalle |
|---|---|---|
| Átomo | `SearchInput`, `FilterSelect`, `Pagination` | **Reutilizados tal cual.** No se tocan |
| Átomo | `BadgeEstadoAviso` | Sólo en `/admin`. Mismo estilo de badge que los paneles existentes |
| Átomo | `AclaracionLegal` | El texto aprobado, al pie de los dos listados y de los dos formularios. Un componente, cuatro usos |
| Molécula | `AvisoTrabajoCard` | Tarjeta del kinesiólogo: nombre, especialidad, localidad/zona, disponibilidad, presentación recortada. **Sin un solo dato de contacto en props** |
| Molécula | `AvisoKinesiologoCard` | Tarjeta de la institución: institución, área, tipo de puesto, modalidad, localidad, fecha límite. Ídem |
| Molécula | `BotonContactar` | `"use client"`. El único cliente del listado. Estados: idle → cargando → revelado (`mailto:`, `wa.me`, descarga de CV) → error. Se monta dentro de las tarjetas, que siguen siendo Server Components |
| Molécula | `TabsBolsa` | Cambio de pestaña por `Link` con `searchParams`. Sin JS |
| Organismo | `FormBuscoTrabajo` | `"use client"` (input de archivo + feedback de validación). Checkbox obligatorio que deshabilita el envío mientras no esté tildado. Honeypot oculto |
| Organismo | `FormBuscoKinesiologo` | `"use client"`. Mismo patrón, sin adjunto. `<input type="date">` nativo para la fecha límite |
| Organismo | `ListadoAvisos` | Server Component. Grilla de tarjetas + estado vacío + paginado |
| Página | `/bolsa-de-trabajo` | Hero con el texto introductorio aprobado, CTAs a los dos formularios, pestañas, listado, aclaración legal |
| Navegación | `Navbar` + home | Entrada a la sección. Banner en home, coherente con los bloques existentes |

El listado completo es Server Component; lo único que cruza a cliente es `BotonContactar` y los dos formularios. Es coherente con Server-First y, sobre todo, es lo que hace que D2 funcione.

### D9 — Validación y antispam

Un esquema Zod por formulario en `src/lib/validations/`, **usado en el servidor** dentro de la Server Action de alta (la validación de cliente es comodidad, no control). Reglas: campos requeridos, largos máximos por campo de texto, correo con formato, teléfono normalizado, `aceptaDifusion` que sólo acepta `true` (con `z.literal(true)`, así el checkbox destildado falla en el servidor y no sólo en el navegador), FKs que deben existir en catálogo, CV por tipo y tamaño.

Antispam de esta versión: campo honeypot oculto (si viene lleno, se responde `{ success: true }` y no se guarda nada), límites de tamaño, y la moderación (aprobación previa del admin). Sin captcha: para el volumen esperado es agregar una dependencia y fricción a cambio de poco.

## Risks / Trade-offs

**[Un `select` futuro que traiga el objeto completo]** Alguien agrega un campo al listado, usa `include` y filtra el teléfono sin darse cuenta. → El tipo público no tiene esos campos; romperlo exige editar el repositorio. Se deja un test que falla si el `select` público incluye una columna de contacto, y un comentario en el schema marcando el bloque.

**[La Server Action de revelado es enumerable por alguien que lea el bundle]** → Asumido y documentado en la spec. Elimina el scraping automático y la indexación, no al atacante dedicado. Upgrade disponible sin rediseño: límite de tasa por IP dentro de la action.

**[Formulario público con adjunto = superficie de abuso]** → Bucket privado sin ejecución, whitelist de tipos, 5 MB, nombre de objeto generado, honeypot, y moderación: nada se publica sin que un humano lo mire.

**[El catálogo de especialidades puede no cubrir a quien publica]** Un kinesiólogo con una especialidad que no está en `Especialidad` no puede completar el formulario. → Es la contracara de tener filtros limpios. Mitigación: el campo `zona` libre y la presentación libre absorben el matiz, y el admin puede agregar la especialidad al catálogo, que ya es un ABM existente. Si en la práctica molesta, se agrega un "Otra" con texto libre.

**[Datos personales publicados en un sitio institucional]** → Consentimiento explícito persistido con timestamp, texto legal aprobado a la vista, contacto fuera del HTML, y la posibilidad de que el Círculo baje un aviso a pedido. Es lo que corresponde para el alcance pedido.

**[Reutilizar `Localidad`/`Especialidad` acopla la bolsa al padrón]** Borrar una localidad del catálogo rompería avisos. → Ya pasa hoy con `Profesional`: la FK lo impide. Sin cambio de riesgo respecto del estado actual.

## Migration Plan

1. `prisma db push` con los dos modelos nuevos. Aditivo: no toca ninguna tabla existente.
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` sobre las dos tablas nuevas, en el SQL Editor de Supabase.
3. Crear el bucket `bolsa-trabajo-cv` **privado**. Verificar que un objeto no se puede abrir por URL pública.
4. Deploy del código con la sección publicada pero **sin enlace en el Navbar**.
5. Probar el circuito completo en producción con un aviso de prueba: carga → (aprobación) → listado → `view-source` sin contacto → botón "Contactar" → CV firmado.
6. Borrar el aviso de prueba, publicar el enlace en el Navbar y el banner de home.

**Rollback:** revertir el deploy y quitar el enlace. Las tablas quedan sin lectores, inertes, con los avisos cargados intactos. Ningún dato preexistente se modifica en ningún paso.

## Decisiones confirmadas por el cliente

- **Moderación**: sí, con aprobación previa del admin (D6).
- **Vigencia de los avisos de kinesiólogo** (D7): no caducan, los archiva el admin.
- **Checkbox de consentimiento en el formulario de instituciones**: sí, por simetría. El schema ya lo contempla.

## Open Questions

- **Quién recibe el aviso de que hay una publicación nueva.** Con moderación activa, alguien tiene que mirar la bandeja. ¿Alcanza con revisarla a mano o hace falta un mail al Círculo? (Notificaciones están fuera de scope en esta versión; si hace falta, es un change aparte y el proyecto ya tiene Resend integrado.)
