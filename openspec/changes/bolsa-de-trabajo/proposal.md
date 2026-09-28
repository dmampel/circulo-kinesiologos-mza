## Why

Hoy el Círculo recibe búsquedas laborales por mail, WhatsApp y teléfono, y las difunde a mano. No hay ningún lugar en el sitio donde un kinesiólogo que busca trabajo y una institución que busca kinesiólogo se encuentren sin que alguien del CKFM haga de cartero. El pedido del cliente —ya validado— es una sección **Bolsa de Trabajo** con dos formularios de carga y dos listados navegables, y **sin intermediación**: el Círculo publica, las partes se contactan solas.

El problema no resuelto no es el formulario: es **publicar datos de contacto de personas en una página pública sin regalárselos a los bots**. Teléfonos, correos y CVs de kinesiólogos reales, indexables por Google y cosechables por cualquier scraper, es exactamente lo que no puede pasar. De ahí sale la decisión técnica central del change.

## Copy aprobada por el cliente

Usar tal cual, sin parafrasear. Esta es la fuente canónica — si el código y este texto difieren, corregir el código.

**Texto introductorio** (hero de `/bolsa-de-trabajo`):

> Bolsa de Trabajo CKFM: un espacio para conectar profesionales y oportunidades laborales.
> Si sos kinesiólogo y estás buscando una oportunidad laboral o si necesitás incorporar un profesional a tu equipo, podés publicar tu búsqueda aquí.
> El CKFM recibe y difunde las búsquedas para facilitar el encuentro entre profesionales y empleadores.

**Aclaración legal** (pie de los dos listados y los dos formularios, componente `AclaracionLegal`):

> Importante: la publicación de una búsqueda no implica recomendación, contratación ni intermediación laboral por parte del CKFM. Las condiciones de cada propuesta y el proceso de selección son responsabilidad de las partes involucradas.

## What Changes

- **Sección pública nueva `/bolsa-de-trabajo`**, con el texto introductorio aprobado por el cliente, los dos listados navegables y la aclaración legal al pie de ambos.
- **Dos formularios públicos de carga**, sin login: "Busco trabajo" (kinesiólogo, con CV adjunto y checkbox obligatorio de aceptación de difusión) y "Busco kinesiólogo" (institución / consultorio / profesional).
- **Los listados son navegables y filtrables** por los campos no sensibles (especialidad, localidad, tipo de puesto), con el mismo patrón `searchParams` + Zod + Server Component que ya usa `/profesionales`.
- **El dato de contacto nunca entra en el HTML.** Ni teléfono, ni correo, ni medio de contacto, ni el CV. El repositorio público hace `select` explícito y **no trae esas columnas**: no están en el payload inicial, no las ve un crawler, no las indexa Google. Un botón "Contactar" las pide por Server Action al hacer click y recién ahí aparecen (con enlaces `mailto:` / `wa.me` pre-armados y, para el CV, una URL firmada de vida corta).
- **Simétrico para los dos tipos de aviso.** El contacto de la institución se protege igual que el del kinesiólogo.
- **Registro de consentimiento**: el checkbox de aceptación se persiste con su timestamp. Es la prueba de que esa persona autorizó la difusión de sus datos.
- **Cero intermediación del CKFM.** No hay derivación, no hay matching, no hay revisión de contenido de la propuesta. El Círculo publica y se corre.

### Fuera de scope

- Cuentas, login o "mis avisos" para quien publica. Los formularios son anónimos y de una sola vía; editar o bajar un aviso se pide al Círculo.
- Postulaciones dentro del sitio (botón "postularme", tracking de candidatos, mensajería interna). El contacto ocurre fuera de la plataforma, por decisión del cliente.
- Notificaciones por mail de avisos nuevos (ni al Círculo ni a los usuarios), alertas de búsqueda y newsletter de la bolsa.
- Captcha / reCAPTCHA. La defensa antispam de esta versión es honeypot + límites de archivo + moderación.
- Vincular los avisos con `Profesional`. Quien publica puede no estar en el padrón, y la matrícula se guarda como texto declarado, no verificado contra la base.

## Capabilities

### New Capabilities

- `bolsa-de-trabajo`: publicación, moderación (si se confirma), listado público y revelado de contacto bajo demanda de los avisos laborales, en sus dos tipos —kinesiólogo que busca trabajo e institución que busca kinesiólogo—. Incluye el requisito de que ningún dato de contacto se sirva en la respuesta inicial de la página.

### Modified Capabilities

- Ninguna. No cambia el comportamiento especificado de ninguna capability existente.

## Impact

### Base de datos y migraciones

**Dos tablas nuevas y un enum nuevo.** Se aplican con `prisma db push` (el proyecto no usa carpeta de migraciones).

| Elemento | Detalle |
|---|---|
| `enum EstadoAviso` | `PENDIENTE`, `PUBLICADO`, `RECHAZADO`, `ARCHIVADO` |
| `model AvisoBuscoTrabajo` | aviso del kinesiólogo. FK a `Localidad` y a `Especialidad` |
| `model AvisoBuscoKinesiologo` | aviso de la institución. FK a `Localidad` |
| `Localidad`, `Especialidad` | sólo se les agrega la relación inversa. Sin cambios de columnas |

**RLS obligatoria** (AGENTS.md, pilar 5). Después del `prisma db push`, en el SQL Editor de Supabase:

```sql
ALTER TABLE "AvisoBuscoTrabajo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AvisoBuscoKinesiologo" ENABLE ROW LEVEL SECURITY;
```

Sin políticas adicionales: el sitio accede con `service_role`, que bypasea RLS.

### Supabase Storage

**Bucket nuevo `bolsa-trabajo-cv`, privado.** Mismo tratamiento que `solicitudes`: los objetos no se sirven nunca por URL pública, se firman por request con vigencia corta. Guarda CVs de personas reales.

### Código afectado

| Área | Cambio |
|---|---|
| `prisma/schema.prisma` | Dos modelos + enum + relaciones inversas |
| `src/lib/repositories/AvisoRepository.ts` | **Nuevo.** Único punto de acceso. Separa `select` público (sin contacto) de `select` de contacto |
| `src/lib/storage/` | Firma de URLs del CV, reutilizando el patrón de `solicitudes.ts` |
| `src/lib/validations/` | Esquemas Zod de los dos formularios y de los `searchParams` del listado |
| `src/app/bolsa-de-trabajo/` | **Nuevo.** Listados, formularios de carga y Server Actions (alta + revelado de contacto) |
| `src/app/admin/bolsa-de-trabajo/` | **Nuevo, condicionado a la decisión de moderación** (ver abajo) |
| `src/components/` | Tarjeta de aviso, botón "Contactar", aclaración legal, formularios |
| `src/components/Navbar.tsx` + home | Punto de entrada a la sección |

### Personas afectadas

Kinesiólogos e instituciones que publiquen: sus datos de contacto quedan accesibles a cualquier visitante que haga click en "Contactar". El checkbox obligatorio es lo que lo vuelve legítimo, y el texto legal aclara que el CKFM no intermedia ni recomienda.

## Decisión de moderación — confirmada por el cliente

**Los avisos SÍ pasan por moderación.** El cliente confirmó que no se publican al instante: toda carga nueva ("Busco trabajo" y "Busco kinesiólogo") arranca en `PENDIENTE` y requiere que un admin la apruebe antes de aparecer en el listado público. Hay pantalla de revisión en `/admin/bolsa-de-trabajo`.

**Motivo:** un formulario público, anónimo y con adjunto es un imán de spam, y acá el spam no es ruido interno: se publica con el logo del CKFM al lado. Un admin que aprueba con un click antes de que el aviso sea visible es barato y evita tener que pedir disculpas.

El impacto en el resto del change queda acotado: **el esquema es el mismo** que se hubiera usado sin moderación, sólo cambia el valor por defecto de `estado` (`PENDIENTE`, no `PUBLICADO`) y que `/admin/bolsa-de-trabajo` es una bandeja de revisión (aprobar / rechazar / archivar), no un simple listado con baja.

### Otras decisiones (menores) — confirmadas

- **Vigencia de los avisos.** Los de institución tienen "fecha límite para postularse": se ocultan automáticamente pasada esa fecha (un filtro en la consulta, sin cron ni infraestructura). Los de kinesiólogo no tienen fecha y no caducan solos; el Círculo los archiva a mano.
- **Checkbox de consentimiento en el formulario de instituciones.** Se incluye también ahí, no sólo en el de kinesiólogos, por simetría y por prolijidad legal (el medio de contacto de un consultorio suele ser el celular de una persona).

## Risks

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Spam / avisos falsos en un formulario público anónimo | Alta | Moderación (si se confirma) + honeypot + límites de tipo y tamaño de archivo + Zod estricto |
| Que un contacto se filtre al HTML por descuido en un `select` futuro | Media | El repositorio es el único acceso y expone un tipo público sin esos campos: filtrarlo requiere romper tipos a propósito |
| Que alguien llame la Server Action de revelado en bucle para cosechar contactos | Baja | No está en el HTML, no la descubre un crawler, no la indexa Google. Es una barrera alta, no un muro: si aparece abuso, se agrega límite de tasa |
| CV con malware subido al bucket | Baja | Bucket privado, sin ejecución, whitelist de tipos, URL firmada de vida corta. El CKFM no abre CVs: los abre quien contrata |
| Localidad y especialidad tomadas de catálogo dejan afuera un caso | Media | Campo libre de "zona" complementario; si falta una especialidad, el admin la agrega al catálogo existente |

## Rollback

Revertir el deploy y quitar el enlace del Navbar. Las dos tablas quedan huérfanas y sin lectores: no rompen nada y conservan los avisos ya cargados por si se vuelve a desplegar. Si hace falta limpiar de verdad, `DROP TABLE` de ambas y borrado del bucket. Ningún dato preexistente se toca en ningún momento del change.

## Success Criteria

- [ ] Los dos formularios cargan un aviso completo, con CV en el caso del kinesiólogo, y validan en servidor con Zod.
- [ ] Sin el checkbox de aceptación, el formulario de kinesiólogo no se puede enviar.
- [ ] Buscar el teléfono o el correo de un aviso publicado en el HTML servido (`view-source`) **no lo encuentra**.
- [ ] El botón "Contactar" revela el dato al hacer click, y el enlace del CV es firmado y de vida corta.
- [ ] Los listados filtran por especialidad, localidad y tipo de puesto sin recargar datos sensibles.
- [ ] Los avisos de institución vencidos dejan de aparecer.
- [ ] `npx vitest run` en verde, con cobertura del `select` público del repositorio y de las validaciones.
- [ ] RLS habilitada y verificada en ambas tablas.
