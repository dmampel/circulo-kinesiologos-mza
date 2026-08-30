## Context

Ver `proposal.md — Why` para la motivación y el baseline de producción. Lo relevante para el diseño:

- **52 archivos** de `src/app` declaran `export const dynamic = "force-dynamic"`: 26 en `/admin`,
  17 en `/mi-panel`, y **9 rutas públicas**. Sólo `src/app/obras-sociales/page.tsx` declara
  `revalidate` (60 s), pero convive con `force-dynamic`, que gana.
- El resultado medido es `x-vercel-cache: MISS` y `cache-control: no-store` en el 100% de las requests.
- `prisma/schema.prisma` tiene 19 modelos y **cero `@@index`**. La única migración existente es
  `20260504163209_init`.
- `middleware.ts` aplica `updateSession` con un matcher que excluye sólo assets estáticos, así que
  `supabase.auth.getUser()` —un round-trip de red— corre en toda navegación, incluida la de anónimos.
- Existe un piso de ~0.79 s en la ruta más liviana que no se explica por el costo de las queries.
- El cliente Prisma (`src/lib/prisma.ts`) es un singleton sin configuración de logging.

**Restricción del framework que condiciona todo el diseño de cache**: en el App Router, leer
`searchParams` opta a la ruta por render dinámico, sin importar qué valor tenga `revalidate`.
De las 9 rutas públicas, tres leen `searchParams` (`/profesionales`, `/noticias`, `/kineclub`)
y por lo tanto **no pueden servirse desde el edge**. Esto parte el trabajo de caching en dos
mecanismos distintos, y es la decisión estructural del change.

## Goals / Non-Goals

**Goals:**
- Que las rutas públicas sin `searchParams` se sirvan desde el edge con `x-vercel-cache: HIT`.
- Que las rutas públicas con `searchParams` dejen de golpear la base para datos que no dependen
  de la request.
- Reducir el piso fijo de latencia eliminando trabajo innecesario del camino de request de anónimos.
- Dejar el schema con índices sobre las columnas que las consultas existentes realmente usan.
- Que la mejora sea demostrable con el mismo método de medición que produjo el baseline.

**Non-Goals:**
- No se persigue una cifra objetivo de TTFB. El criterio de éxito es el cambio de `MISS` a `HIT`
  y una mejora medida y registrada, no un número prometido de antemano.
- No se rediseña la UI. Este change no toca componentes ni Tailwind; no hay desglose de Atomic
  Design aplicable porque no se crea ni modifica ningún componente visual.
- No se corrige que las stats del home tengan valores hardcodeados (`+30` obras sociales,
  `+15` beneficios) pese a que la spec `home-presentation` pide conteos reales. Es una
  divergencia preexistente, ajena a performance. Se documenta como hallazgo, no se arregla acá.

## Decisions

### D1 — Dos mecanismos de cache según la ruta lea o no `searchParams`

Las 9 rutas públicas se dividen así:

**Grupo A — cacheables en el edge** (no leen `searchParams`; se les quita `force-dynamic` y se les
pone `revalidate`):

| Ruta | `revalidate` | Razón del valor |
|------|--------------|-----------------|
| `src/app/page.tsx` | 300 s | Home: noticias/capacitaciones/beneficios cambian con baja frecuencia; 5 min es tolerable para la autora de contenido. |
| `src/app/institucional/page.tsx` | 3600 s | Contenido institucional casi estático. |
| `src/app/obras-sociales/page.tsx` | 3600 s | Padrón de convenios, cambia rara vez. Sube desde los 60 s actuales, que hoy además son inefectivos por convivir con `force-dynamic`. |
| `src/app/noticias/[slug]/page.tsx` | 3600 s | Una noticia publicada no cambia. |
| `src/app/profesionales/[slug]/page.tsx` | 3600 s | La ficha cambia sólo cuando el profesional edita su perfil. |
| `src/app/sitemap.ts` | 3600 s | Consumido por crawlers, no por personas. |

**Grupo B — render dinámico inevitable** (leen `searchParams`): `/profesionales`, `/noticias`,
`/kineclub`. Se les quita `force-dynamic` igual —es redundante y engañoso— pero el
`revalidate` no les daría un HIT de edge. Para estas rutas la ganancia viene de D2.

*Alternativas consideradas*: (a) mover los filtros a estado de cliente para volver las rutas
estáticas — rompe el SEO del padrón y las URLs compartibles, que es justamente lo que se quería
preservar al descartar React Query; (b) `generateStaticParams` para prerenderizar las combinaciones
de filtros — explosión combinatoria sin cota razonable. Ambas descartadas.

### D2 — `unstable_cache` para los datos que no dependen de la request en el Grupo B

En las rutas del Grupo B, parte de los datos no dependen de `searchParams` en absoluto: los
selectores de localidades y especialidades de `/profesionales`, y las categorías de `/noticias`
y `/kineclub`. Hoy se consultan a la base en cada request. Se envuelven esas lecturas en el cache
de datos de Next con una etiqueta y un TTL, de modo que la ruta siga renderizando por request pero
sin consultar la base para datos que son idénticos para todos.

*Alternativa considerada*: cachear también el resultado paginado del padrón por combinación de
filtros. Descartada por ahora — la cardinalidad de combinaciones es alta y la medición no muestra
que esa query sea el problema. Si tras el despliegue el TTFB del Grupo B sigue alto, se reevalúa
con datos.

### D3 — Índices: sólo B-tree, y `pg_trgm` se difiere

**Esta es la decisión que más cambió respecto del diagnóstico inicial.** Se presumía que el
`ILIKE '%texto%'` del padrón era la causa principal. La medición lo desmiente: `?query=gonzalez`
(1.09 s) es indistinguible de la página sin filtro (1.05 s).

Opciones evaluadas para acelerar el `contains` + `mode: "insensitive"`:

| Opción | Qué resuelve | Costo / riesgo | Veredicto |
|--------|--------------|----------------|-----------|
| `pg_trgm` + índice GIN | Es la única que acelera de verdad `ILIKE '%texto%'`; un B-tree no sirve porque el comodín inicial impide usar el prefijo. | Requiere `CREATE EXTENSION` en la base de producción; el índice GIN es grande y encarece las escrituras; construirlo toma un lock salvo que se use `CONCURRENTLY`, que Prisma Migrate no emite. | **Diferido** |
| Columna normalizada + B-tree | Permite prefijo rápido sobre texto normalizado, pero sigue sin resolver el comodín inicial. | Agrega columna, requiere backfill y mantenimiento por trigger o a nivel aplicación. Cambio de schema no trivial. | Descartada |
| Full-text search de Postgres | Rápida y sin extensión extra, pero busca por palabra, no por substring: `"gonz"` dejaría de encontrar `"Gonzalez"`. | **Cambia el comportamiento observable de la búsqueda.** | Descartada |
| Sólo B-tree en FKs y columnas de filtro/orden | No acelera el `ILIKE`, pero sí el `orderBy: apellido`, el filtro `status`, los filtros por FK y las consultas del portal. | Bajo. Aditivo, reversible, índices chicos. | **Elegida** |

Se elige la cuarta. El razonamiento: sin evidencia de que el ILIKE domine, instalar una extensión y
construir un índice GIN contra la base de producción es asumir riesgo por un beneficio no medido.
Los B-tree se agregan como higiene —Postgres **no** crea índices automáticamente sobre las columnas
de clave foránea, a diferencia de la clave primaria— y como prevención para el crecimiento del padrón.

**Disparador explícito para retomar `pg_trgm`**: si tras completar este change una búsqueda del
padrón con filtro de texto muestra un TTFB significativamente peor que la misma página sin filtro,
se abre un change dedicado. Hoy esa diferencia es de ~40 ms y no lo justifica.

**Índices propuestos, uno por uno, cada uno atado a una consulta existente:**

| Modelo | Índice | Consulta que lo justifica |
|--------|--------|---------------------------|
| `Profesional` | `@@index([status, apellido])` | `findPaginated` filtra `status: "ACTIVO"` y ordena por `apellido asc` en todas las visitas al padrón. |
| `Profesional` | `@@index([localidadId])` | Filtro por localidad del padrón; además es FK sin índice. |
| `Noticia` | `@@index([publicada, publicada_en])` | Home y `/noticias` filtran `publicada` y ordenan por `publicada_en desc`. |
| `Noticia` | `@@index([categoriaId])` | Filtro por categoría en `/noticias`; FK sin índice. |
| `Capacitacion` | `@@index([publicada, fechaInicio])` | `findPublicadas` filtra `publicada` y ordena por `fechaInicio asc`. |
| `BeneficioKineClub` | `@@index([activa, createdAt])` | Home selecciona activos ordenados por `createdAt desc`. |
| `BeneficioKineClub` | `@@index([categoriaId])` | Filtro por categoría en `/kineclub`; FK sin índice. |
| `ObraSocial` | `@@index([activa, orden])` | `getAllActive` filtra `activa` y ordena por `orden asc`. |
| `Circular` | `@@index([publicada, publicada_en])` | Listado de circulares del portal del socio. |
| `Turno` | `@@index([profesionalId, fecha])` | El turnero lista los turnos de un profesional por fecha. |
| `Paciente` | `@@index([profesionalId])` | Listado de pacientes por profesional; FK sin índice. |
| `LecturaCircular` | `@@index([profesionalId])` | El `@@unique([circularId, profesionalId])` existente ya cubre búsquedas que arrancan por `circularId`, pero no las que arrancan por `profesionalId`. |

**No se indexa** la tabla de unión implícita `Profesional`↔`Especialidad`: Prisma la gestiona y ya
crea sus propios índices; no es declarable vía `@@index` en el schema. Tampoco se indexan columnas
ya cubiertas por `@unique` (`slug`, `matricula`, `email`, `wp_id`, `userId`), que llevan índice implícito.

### D4 — Alcance del middleware: lista explícita de rutas dentro y fuera

`updateSession` cumple dos funciones: refresca las cookies de sesión de Supabase y aplica el gate
de acceso a `/admin` y `/mi-panel`. Acotar de más deja rutas protegidas sin gate, así que la
enumeración es explícita.

**Dentro del matcher (el middleware SÍ corre):**
- `/admin/:path*` — gate de sesión + verificación de `app_metadata.role === "admin"`.
- `/mi-panel/:path*` — gate de sesión.
- `/login`, `/registro`, y las rutas de callback y recuperación de contraseña de Supabase Auth —
  necesitan que las cookies de sesión se escriban y refresquen en la respuesta. Excluirlas es el
  error clásico que produce deslogueos aleatorios.

**Fuera del matcher (el middleware NO corre):**
- `/`, `/profesionales`, `/profesionales/:slug`, `/noticias`, `/noticias/:slug`, `/kineclub`,
  `/institucional`, `/obras-sociales`, `/sitemap.xml`, `/robots.txt` — contenido público de sólo
  lectura, idéntico para todos, sin ninguna decisión de autorización.
- Assets estáticos, ya excluidos hoy.

**Por qué es seguro**: ninguna ruta que hoy recibe una redirección del middleware sale del matcher.
El gate de `/admin` y `/mi-panel` queda intacto y es el único control que el middleware aplicaba.
Las rutas que salen no tenían ninguna lógica de autorización: para ellas `updateSession` sólo
gastaba un round-trip a Supabase Auth y descartaba el resultado.

**Salvaguarda que el diseño exige**: el middleware nunca fue la única defensa de las Server Actions
ni de las lecturas con datos del usuario. Antes de acotar el matcher hay que confirmar que cada
ruta protegida valida la sesión también en su propio `layout` o página. Si alguna dependía sólo
del middleware, eso es un hallazgo de seguridad preexistente y debe reportarse, no taparse.

*Alternativa considerada*: dejar el matcher amplio y usar `getSession()` (lee la cookie sin ir a la
red) en vez de `getUser()`. Descartada: `getSession()` no valida el JWT contra el servidor y usarla
para decisiones de autorización es explícitamente desaconsejado por Supabase.

### D5 — Queries acotadas: métodos nuevos, no cambio de los existentes

Los tres `findMany` sin `take` del home están **compartidos con otras páginas que sí necesitan el
conjunto completo**. Cambiarlos en el lugar rompería a esos consumidores:

| Método | Consumidores | Decisión |
|--------|--------------|----------|
| `NoticiaRepository.getLatest()` | Sólo `src/app/page.tsx` | Se acota en el lugar: se agrega `where: { publicada: true }` y `take`. |
| `BeneficioRepository.getAll(category?)` | `src/app/page.tsx` y `src/app/kineclub/page.tsx` (esta última necesita todos los de la categoría) | **No se toca.** Se agrega un método nuevo acotado para el home. |
| `CapacitacionRepository.findPublicadas()` | `src/app/page.tsx` y `src/app/mi-panel/capacitaciones/page.tsx` (esta última necesita todas) | **No se toca.** Se agrega un método nuevo acotado para el home. |

**El orden dentro de cada cambio es obligatorio: primero mover el filtro al `where`, después agregar
`take`.** Hoy el home trae la tabla entera y filtra en JavaScript (`.filter(n => n.publicada).slice(0,3)`).
Agregar `take: 3` sin haber movido antes el filtro introduce un bug silencioso: si las 3 noticias
más recientes están sin publicar, la sección del home queda vacía. Lo mismo con `activa` en
beneficios y con `fechaInicio >= hoy` en capacitaciones.

`ObraSocialRepository.getAllActive()` se deja como está: el home renderiza la lista completa y el
marquee, así que no hay nada que acotar.

### D6 — Instrumentación de medición

Se configura el cliente Prisma para emitir el evento `query` con su duración **sólo fuera de
producción**, respetando el patrón singleton existente de `src/lib/prisma.ts`. Esto da el costo por
query, que el TTFB por sí solo no desagrega.

*Por qué no en producción*: el logging por query en serverless agrega overhead y ruido en cada
invocación, que es justamente lo que se está tratando de reducir. El baseline de producción ya
existe y se mide desde afuera con `curl`, sin instrumentar la aplicación.

### D7 — El piso de ~0.79 s se investiga antes de intentar arreglarlo

El piso aparece incluso en `/noticias` (48 KB, pocas queries), así que no proviene del volumen de
datos. Hipótesis a verificar, en orden de probabilidad:

1. **Middleware** — un round-trip a Supabase Auth antes de cada render. D4 lo elimina para rutas
   públicas; el efecto se mide comparando el TTFB antes y después de ese cambio aislado.
2. **Distancia de red entre la función de Vercel y el proyecto Supabase** — si la región de la
   función y la del proyecto no coinciden, cada query paga la latencia entre regiones, y varias
   queries en `Promise.all` pagan al menos un round-trip.
3. **Modo de conexión de `DATABASE_URL`** — pooler de Supabase (puerto 6543, `pgbouncer=true`) o
   conexión directa (5432). En serverless, la conexión directa implica handshake por invocación y
   riesgo de agotar el pool de conexiones.

Los puntos 2 y 3 requieren inspeccionar variables de entorno y la configuración del proyecto en
Vercel y Supabase. **Son tareas de verificación para la usuaria; este change no lee secretos ni
credenciales.** Si la verificación revela una configuración incorrecta, el arreglo se decide con
ese dato en mano.

## Risks / Trade-offs

- **[Un `revalidate` mal puesto muestra datos viejos]** → Ninguna página bajo `/admin` o `/mi-panel`
  recibe `revalidate`; las 43 conservan `force-dynamic`. La tabla de D1 es exhaustiva: sólo esas 6
  rutas cambian a `revalidate`, y sólo esas 3 del Grupo B pierden `force-dynamic` sin ganarlo.
- **[La autora publica contenido y no lo ve reflejado]** → Ventanas acotadas (300 s en el home) y
  advertencia explícita en la tarea de verificación. Si la espera resulta molesta en la práctica,
  la evolución natural es revalidación bajo demanda desde las Server Actions del admin; queda
  anotada como trabajo futuro, no se implementa acá.
- **[Acotar el matcher deja una ruta protegida sin gate]** → D4 enumera rutas explícitamente, ninguna
  ruta con redirección sale del matcher, y se exige confirmar la validación de sesión en cada layout
  protegido **antes** de tocar el matcher.
- **[Excluir rutas de auth del matcher rompe el refresco de sesión]** → `/login`, `/registro` y los
  callbacks de Supabase se mantienen dentro del matcher precisamente por esto.
- **[La migración corre contra producción — gobernanza HIGH]** → Ver plan de migración. Sólo
  `CREATE INDEX`, sin DDL destructivo, con aprobación explícita previa.
- **[La creación de índices toma locks]** → Los índices son chicos sobre tablas chicas, así que la
  ventana es breve. Aun así se aplica en horario de bajo tráfico. Si alguna tabla resultara más
  grande de lo esperado, se evalúa `CREATE INDEX CONCURRENTLY` por SQL manual en vez de Prisma Migrate.
- **[Los índices encarecen las escrituras]** → Aceptado: este sitio es abrumadoramente de lectura.
  Es también la razón de no agregar índices especulativos.
- **[Contenido de sesión filtrado a un cache compartido]** → Ninguna ruta que lea cookies o sesión
  se vuelve cacheable. Las tres rutas del Grupo B siguen siendo dinámicas.
- **[Interferencia con `registro-upload-directo`]** → Ese change (31/46) toca `/registro` y Storage;
  este toca páginas públicas, middleware, repositorios de lectura y schema. El único punto de
  contacto potencial es `middleware.ts` si aquel modificara rutas de auth. Se verifica antes de tocar
  el matcher.

## Migration Plan

Gobernanza **HIGH**: la migración toca la base de producción. Requiere aprobación explícita de la
usuaria antes de aplicarse.

1. Editar `prisma/schema.prisma` agregando únicamente los bloques `@@index` de la tabla en D3.
2. Generar la migración con `prisma migrate dev` **contra una base de desarrollo**, nunca contra producción.
3. **Revisar el SQL generado a mano y confirmar que contiene sólo sentencias `CREATE INDEX`.**
   Si aparece cualquier `ALTER`, `DROP` o `UPDATE`, detenerse: significa que el schema divergió de
   la base y eso es un problema distinto que resolver antes.
4. Presentar el SQL a la usuaria para aprobación explícita.
5. Aplicar en producción con `prisma migrate deploy`, en horario de bajo tráfico.
6. Verificar que los índices existen y que la aplicación sigue respondiendo.

**Rollback**: cada índice se elimina con `DROP INDEX <nombre>;`. La operación no toca datos y es
segura de ejecutar en caliente. El resto del change (revalidate, matcher, queries) se revierte con
un redeploy del commit anterior, sin implicancia sobre la base.

**Orden de despliegue recomendado** — para poder atribuir la mejora a cada causa, y porque el
protocolo de medición lo exige, los cambios se despliegan en pasos separados y se mide entre uno y otro:
primero el caching del Grupo A (mayor impacto, menor riesgo), después el matcher del middleware,
después las queries acotadas, y por último la migración de índices.

## Open Questions

- ¿Cuál es la ventana de staleness máxima tolerable para la autora de contenido en el home?
  Se asume 300 s; si resulta molesto, es un ajuste de una constante y no cambia el diseño.
- ¿En qué región están la función de Vercel y el proyecto Supabase? Dato de verificación (D7).
  Si no coinciden, la respuesta se decide con la medición en mano; no altera el resto del change.
- ¿Los 223 KB de HTML de `/profesionales` se explican por el tamaño de página del padrón (24 ítems)
  o por markup redundante? Se investiga y documenta; cualquier optimización de payload es un change
  aparte.
