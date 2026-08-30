## Context

Ver `proposal.md — Why` para la motivación y los números. Acá sólo el estado del código y las
restricciones que condicionan el enfoque.

**Lo que ya está resuelto y no se toca.** `perf-db-caching` cerró las dos palancas baratas: cache de
edge en las rutas públicas y co-locación de la función de Vercel (`vercel.json`, `"regions":
["pdx1"]`) con Supabase en `us-west-2`. Ambas quedan como están. `/admin` y `/mi-panel` no se
benefician de ninguna de las dos: son datos privados por usuario, la capability `web-performance` de
aquel change las obliga explícitamente a permanecer dinámicas, y ya están co-locadas.

**Estado del cliente Prisma.** Prisma 6.19.3. El generator no declara `previewFeatures`, así que
`relationLoadStrategy` no existe en el cliente generado —verificado:
`grep -c relationLoadStrategy node_modules/.prisma/client/index.d.ts` devuelve `0`—. La feature
`relationJoins` sí está presente en el binario instalado (`node_modules/prisma/build/index.js` y
`node_modules/@prisma/client/generator-build/index.js`), o sea que no hace falta actualizar Prisma.
`datasource db` declara `url` (pooler de Supabase) y `directUrl`.

**Estado de la instrumentación.** `src/lib/prisma.ts` emite el evento `query` de Prisma con su
duración **sólo cuando `NODE_ENV !== "production"`**. La guarda es deliberada (`perf-db-caching —
design.md — D6`): el logging por query en serverless agrega overhead en cada invocación. Es el
motivo por el que hoy **no se puede contar sentencias en producción**, que es exactamente lo que este
change necesita como primer paso.

**Estado de los caminos calientes**, verificado leyendo el código:

| Lugar | Qué hace hoy | Consecuencia |
|---|---|---|
| `ProfesionalRepository.findPaginated` | `include: { localidad: true, especialidades: true }` | `Profesional` + `Localidad` + `_EspecialidadToProfesional` + `Especialidad`, en transacción |
| `ProfesionalRepository.findBySlug/findByUserId/findByEmail/findByMatricula` | mismo `include` sobre `findUnique` | ídem, por cada llamada |
| `src/app/mi-panel/layout.tsx` | 4 `await` en serie; (3) y (4) no dependen de nada | 3 esperas donde alcanza 1, **en todas las páginas del portal** |
| `src/app/mi-panel/page.tsx` | repite `findByUserId(user.id)` que el layout ya ejecutó, repite `supabase.auth.getUser()`, y encadena 6 `await` más en serie | ~11 round-trips serializados sumando layout + page |
| `src/app/noticias/page.tsx` | llama `NoticiaRepository.getPaginated` dos veces; `getPaginated` hace `findMany` + `count` | 2 listados + 2 conteos; el segundo `count` no lo lee nadie |
| `src/app/admin/page.tsx` | 8 consultas en un solo `Promise.all` | **ya está bien** — es el patrón de referencia |

**Restricciones del framework.** Next 16.2.4, App Router, React 19.2.4. Consultado en
`node_modules/next/dist/docs/`:

- `cache` de React es el mecanismo documentado para memoizar dentro de un render pass. La guía de
  autenticación (`01-app/02-guides/authentication.md`) lo recomienda textualmente para "evitar
  requests duplicadas a la base durante un render pass", y lo usa sobre un `verifySession()` que
  redirige a `/login` — o sea, sobre el caso de uso idéntico al nuestro.
- `unstable_cache` figura como **reemplazado por `use cache` en Next 16**
  (`03-api-reference/04-functions/unstable_cache.md`). `perf-db-caching` acaba de adoptarlo en cuatro
  repositorios de catálogos. Es deuda conocida, **no de este change**: `unstable_cache` sigue
  funcionando y migrarlo acá mezclaría dos cosas.
- `next.config.ts` **no** habilita `cacheComponents` ni `dynamicIO`, así que la semántica de cache de
  Next es la clásica y `cache` de React es puramente per-request.

## Goals / Non-Goals

**Goals**

- Reducir la **cantidad** de sentencias SQL por request en `/mi-panel/*` y `/admin/*`, que es la
  única palanca que les queda.
- Reducir la **serialización**: que las lecturas independientes se paguen una sola vez de reloj.
- Dejar el conteo de sentencias por ruta medible **en producción**, para que la mejora sea
  demostrable y no argumentada.
- Que todo lo anterior sea reversible sin tocar la base.

**Non-Goals (a nivel diseño, más allá de lo que ya excluye `proposal.md — Impact`)**

- **No se optimiza para el número más chico de sentencias posible.** El objetivo es eliminar las
  sentencias que no aportan nada. Una segunda query que traiga menos bytes que un JOIN es una
  decisión legítima y se conserva.
- **No se cambia el default del cliente Prisma.** Ver D2.
- **No se migra `unstable_cache` a `use cache`.** Deuda de Next 16 registrada, change aparte.
- **No se toca `middleware.ts`.** Su acotamiento es el grupo 4 de `perf-db-caching`, todavía
  pendiente. Dos changes editando el mismo archivo es cómo se pierde una tarde.
- **No se refactoriza la capa de repositorios.** Ver la nota de D5.

## Decisions

### D1 — `relationJoins` se habilita en el generator, y nada más

Una línea en `prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["relationJoins"]
}
```

El bloque `datasource db` **no se toca**. Habilitar la preview por sí sola **no cambia ninguna
query**: `relationLoadStrategy` sigue en su default `"query"` hasta que una query pida
explícitamente otra cosa. Es decir, el paso (1) es inerte y observable, lo cual es justamente lo que
lo hace un buen primer paso.

**Cómo se verifica que quedó habilitado**, sin desplegar nada:

```bash
npx prisma generate
grep -c "relationLoadStrategy" node_modules/.prisma/client/index.d.ts   # antes: 0 — después: > 0
```

Es un criterio binario, local y de costo cero. Si devuelve `0` después de regenerar, el paso falló y
no tiene sentido seguir.

**Detalle de schema de Prisma (regla del proyecto).** Este es el **único** cambio en
`prisma/schema.prisma` de todo el change. No se agregan, eliminan ni renombran modelos, campos,
relaciones, enums ni `@@index`. **No se corre `prisma migrate dev`, `prisma migrate deploy` ni
`prisma db push`.** El esquema físico de la base queda byte por byte igual; lo único que cambia es el
cliente TypeScript generado y el SQL que emite en runtime. El deploy de Vercel corre
`prisma generate` en el build, así que el cliente se regenera solo.

*Alternativa descartada*: actualizar Prisma a una versión donde `relationJoins` sea estable. No hace
falta —la feature ya está en 6.19.3— y meter un salto de versión mayor de ORM dentro de un change de
performance mezcla dos riesgos que conviene poder distinguir cuando algo falle.

### D2 — `relationLoadStrategy: "join"` se aplica **opt-in por query**, nunca como default del cliente

Prisma permite fijar la estrategia globalmente al construir el cliente, o por query. **Se elige por
query.**

El motivo no es cautela genérica, es que **`"join"` no es universalmente mejor**. Con una relación
many-to-many de alta cardinalidad, el LATERAL JOIN devuelve la fila padre repetida —o agregada en
JSON— una vez por cada hijo. `Profesional.especialidades` es exactamente ese caso: un profesional con
seis especialidades, en un listado de doce por página, puede mover más bytes por el cable que las dos
queries separadas que reemplaza. Cambiar el default convertiría esa apuesta en la apuesta por
defecto de **cada `include` de la aplicación**, incluidas las 35 que este change no piensa medir.

Con opt-in por query:

- cada aplicación de `"join"` viene con su propia medición antes/después,
- una query que empeora se revierte borrando una línea, sin arrastrar a las demás,
- el resto de la app sigue con el comportamiento que hoy está en producción y que ya sabemos que
  funciona.

**Criterio de aceptación por query** —las tres condiciones, no una:

1. baja el conteo de sentencias de esa query,
2. no sube el tamaño del payload de la respuesta de forma sensible,
3. el resultado es idéntico al anterior, incluidas las filas con relaciones vacías.

Si (1) se cumple pero (2) no, **la query se deja como está** y se anota por qué. Ese es el resultado
esperado y aceptable para `Profesional.especialidades`; sería una sorpresa mala, no buena, que
`"join"` ganara en todos lados.

**Orden de evaluación**, por relación evidencia/riesgo:

| # | Query | Relación | Por qué en esta posición |
|---|---|---|---|
| 1 | `ProfesionalRepository.findByUserId` | `localidad` (to-one) + `especialidades` (m2m) | Corre en **cada** página de `/mi-panel` vía el layout. Máxima frecuencia. |
| 2 | `ProfesionalRepository.findBySlug` | ídem | Una sola fila: el riesgo de cardinalidad de (1) casi no aplica. |
| 3 | `ProfesionalRepository.findPaginated` | ídem, sobre 12 filas | El caso de mayor ganancia potencial **y** de mayor riesgo de payload. Va después de tener datos de (1) y (2). |
| 4 | `NoticiaRepository.getPaginated` | `categoria` (to-one) | to-one puro: el JOIN es casi seguro mejor. |
| 5 | Resto (`Circular`, `Capacitacion`, `Turno`, `Sorteo`) | varias | Sólo si la medición de (1)–(4) lo justifica. |

Se evalúan de a una, midiendo entre cada una. Se para en cuanto el retorno deje de justificar el
riesgo — no hay obligación de llegar a (5).

*Alternativa descartada*: default global `"join"` con `relationLoadStrategy: "query"` como escape en
las queries problemáticas. Suena equivalente e invierte el default. No lo es: obliga a **descubrir**
cuáles son las problemáticas en producción, sobre 35 `include` que nadie midió, en vez de decidirlo
query por query con evidencia. Es la misma apuesta, hecha a ciegas.

### D3 — Medir en producción: interruptor por variable de entorno, temporal y explícito

Contar sentencias en producción es el paso (1) del change y hoy es imposible: la instrumentación está
apagada por `NODE_ENV === "production"`.

**Decisión**: reemplazar la guarda por entorno por una guarda por **variable de entorno explícita**
(nombre a fijar en la implementación, del tipo `PRISMA_QUERY_LOG`), que en producción está **ausente
por defecto**. Sin la variable, el comportamiento es idéntico al de hoy — cero overhead, cero
logging.

Por qué así y no de otra manera:

- **Es el único entorno donde la medición vale.** El piso de 210 ms del baseline viene de la laptop
  de la usuaria contra Supabase remoto. En `pdx1`, co-locado, el costo por round-trip es de otro
  orden. Medir en cualquier otro lado no responde la pregunta que el change necesita responder.
- **La métrica primaria es el conteo, no el tiempo.** El conteo de sentencias es atribuible al
  cambio. El tiempo absoluto depende de la carga de la base, del estado del pooler y del ruido de la
  red, que este change no controla. El tiempo se registra como contexto, no como criterio.
- **Se enciende para medir y se apaga.** La variable se activa, se recorren las rutas, se descarga el
  log, se desactiva. No queda encendida entre mediciones.

**Restricción de privacidad, no negociable.** El log registra la **forma** de la sentencia y su
duración. Prisma emite el SQL parametrizado (`$1`, `$2`, …) y los valores en un campo aparte: se
registra `e.query` y `e.duration`, y **nunca `e.params`**. Es lo que ya hace `src/lib/prisma.ts` hoy,
y hay que mantenerlo al mover la guarda. Sin esto, un log de `/mi-panel` filtraría datos de socios y
pacientes a los logs de Vercel.

*Alternativas descartadas*:
- **Medir contra una base de staging desde una función co-locada.** Correcto en teoría, pero no hay
  base de staging y crear una réplica de producción para medir cuesta más que el cambio que se está
  midiendo.
- **Dejar la instrumentación siempre encendida en producción.** Reintroduce exactamente el overhead
  por invocación que `perf-db-caching — D6` sacó a propósito.
- **Inferir el conteo desde el baseline de desarrollo.** Es lo que el caveat metodológico del
  proposal prohíbe. El conteo de dev es válido como evidencia de **arquitectura**; no como línea
  base de producción para comparar contra sí misma.

### D4 — Paralelizar y deduplicar: el cambio de mayor impacto, y no depende de ninguna preview

Dos correcciones distintas sobre `/mi-panel`, ambas independientes de D1–D2.

**(a) Paralelizar `src/app/mi-panel/layout.tsx`.** Hoy son cuatro `await` en serie. `getLatestActive`
y `getLatestPublicada` son `findFirst` con `select: { createdAt: true }` —no dependen de nada, ni
siquiera del profesional—. `countUnread` sí depende de `findByUserId`. La forma correcta:
`findByUserId` primero, y después las otras tres en un solo `Promise.all`. Cuatro esperas pasan a
dos. Como el layout corre en las diecisiete páginas del portal, el ahorro se cobra en todas.

**(b) Deduplicar con `cache` de React.** `src/app/mi-panel/page.tsx` vuelve a llamar
`ProfesionalRepository.findByUserId(user.id)` con el mismo argumento que el layout ya resolvió en la
misma request, y vuelve a llamar `supabase.auth.getUser()`. Se envuelven ambas lecturas en `cache` de
React, y la segunda llamada se resuelve con el resultado memoizado, sin emitir sentencias.

Es el patrón que la guía de autenticación de Next 16 documenta textualmente para este caso
(`node_modules/next/dist/docs/01-app/02-guides/authentication.md`), aplicado sobre un
`verifySession()` que también redirige a `/login`.

**Por qué `cache` de React y no `unstable_cache`/`use cache`.** No es una preferencia de estilo, es
una diferencia de alcance con consecuencias de seguridad:

| | `cache` (React) | `unstable_cache` / `use cache` (Next) |
|---|---|---|
| Alcance | un render pass — **una request** | entre requests, y **entre usuarios** |
| Sobrevive a la request | no | sí |
| Apto para datos privados por usuario | **sí** | **NO** |

`findByUserId` devuelve el perfil de **un socio**. Cachearlo entre requests con `unstable_cache` es
como se filtran datos de un socio a otro. `cache` de React muere con la request, que es precisamente
la garantía que pide el spec (`Requirement: Una request SHALL NO repetir la misma lectura`,
escenarios de aislamiento y de dato modificado).

**Dónde vive el `cache`.** En la capa de repositorios, envolviendo el método, no en cada llamador.
Así el layout y la page comparten la memoización sin coordinarse, y ninguna página tiene que saber si
otra ya pidió el dato.

*Alternativa descartada para (b)*: pasar el profesional del layout a la page por props. En App Router
un layout no puede pasar props a `children`; habría que meter un Context de servidor o un provider, y
`cache` de React es la respuesta que el framework ya da a este problema.

**Nota de precedencia.** (a) y (b) no dependen de D1 ni de D2, no necesitan una preview feature, y
atacan el camino que la usuaria reportó como lento. Si por lo que sea hay que recortar el change,
**esto es lo que se conserva.**

### D5 — `/noticias`: un método nuevo, no un refactor

Causa confirmada: `src/app/noticias/page.tsx` llama `NoticiaRepository.getPaginated` dos veces, una
para la grilla y otra —`getPaginated(1, 5)`— para el sidebar "Últimas noticias". `getPaginated` corre
`findMany` **y** `count`. El `count` del sidebar es trabajo íntegramente descartado: nada lee `total`
ni `totalPages` de ese resultado.

No es un doble render de Next ni el layout llamando al repositorio, como conjeturaba
`perf-db-caching — baseline.md`. Es un método usado para un caso de uso que no es el suyo.

**Corrección**: `NoticiaRepository.getUltimas(limit)` — `findMany` con `orderBy`, `take` y el mismo
`include: { categoria: true }`, **sin `count`**. La página lo consume en el sidebar. Se elimina un
listado y un conteo por request.

**`getPaginated` no se toca.** Sigue siendo el método correcto para la grilla, que sí necesita el
total para paginar.

*Alternativa descartada*: agregar un flag `skipCount` a `getPaginated`. Un booleano que cambia la
forma del valor de retorno es peor que dos métodos honestos con nombres distintos.

**Nota sobre la capa de repositorios** (`AGENTS.md`): el diseño roza la consolidación pendiente pero
no la hace. `cache` de React se aplica en los repositorios, así que las páginas que importan
`@/lib/prisma` directo —17 archivos, entre ellos `src/app/admin/page.tsx`— **no** se benefician de la
deduplicación. No es motivo para consolidar ahora; es motivo para que a nadie le sorprenda después.

### D6 — Los `DEALLOCATE ALL` se investigan **después** de re-contar, no antes

Los tres contadores son exactamente iguales: 76 `BEGIN`, 76 `COMMIT`, 76 `DEALLOCATE ALL`. Esa
igualdad exacta es el dato. Indica que el `DEALLOCATE ALL` se emite una vez por transacción, o sea
que está atado a las mismas transacciones que D2 busca eliminar. Si `"join"` convierte esas
transacciones en una sentencia única, los `DEALLOCATE ALL` deberían caer en la misma proporción **sin
tocar la cadena de conexión**.

Por eso el orden es: aplicar D2 → volver a contar → recién ahí evaluar la configuración del pooler.
Si el conteo ya bajó, la verificación pasa de arreglo a higiene.

**Qué tiene que mirar la usuaria** (tarea suya, no del agente — el change **no lee `.env`**): en el
`DATABASE_URL` del proyecto de Vercel, únicamente dos cosas:

1. **El puerto**: `6543` es el pooler de Supabase en modo transacción; `5432` es conexión directa.
2. **La presencia del parámetro `pgbouncer=true`** en la query string.

Se registra sólo "puerto 6543, `pgbouncer=true` ausente" o equivalente. **Nada más**: ni usuario, ni
contraseña, ni host, ni el string completo. El hallazgo va a `baseline.md`; la credencial no va a
ningún lado.

Si el parámetro falta **y** el conteo posterior a D2 muestra que los `DEALLOCATE ALL` siguen siendo
significativos, agregarlo es un cambio de variable de entorno en Vercel —lo hace la usuaria, con su
propio redeploy y su propia verificación—, no una edición de código de este change.

### D7 — Desglose de componentes UI

**No aplica: este change no toca la capa de presentación.** No se crea, elimina ni modifica ningún
componente de React, ni ningún estilo. Los archivos de `src/app/` que se editan
—`mi-panel/layout.tsx`, `mi-panel/page.tsx`, `noticias/page.tsx`— se tocan **exclusivamente** en su
sección de obtención de datos: los `await` de arriba del `return`. El JSX que devuelven queda
intacto.

Es la regla de aceptación más simple del change y conviene tenerla a mano durante la revisión: **si
un diff toca JSX, className o markup, se salió de alcance.** El spec lo exige del lado observable
(`Requirement: La reducción de round-trips SHALL preservar el comportamiento observable`); esto es su
contraparte del lado del código.

## Risks / Trade-offs

**`relationJoins` es una preview feature en producción** → El riesgo real es acotado y hay que
dimensionarlo bien, no exagerarlo ni minimizarlo. **No es una migración de base**: no hay `CREATE
INDEX`, no hay `ALTER`, no se ejecuta `prisma migrate` en ninguna forma, el esquema físico queda
idéntico. Cambia la generación del cliente y el SQL emitido. **Es cualitativamente distinto del grupo
6 diferido de `perf-db-caching`**, que sí aplicaba DDL contra la base de producción — no confundir
ambos riesgos. Mitigación: opt-in por query (D2), de a una y con medición entre cada una.
**Rollback**: borrar `relationLoadStrategy` de la query afectada, o borrar `previewFeatures` del
generator, `prisma generate`, desplegar. Sin pérdida de datos, sin ventana de mantenimiento, sin
migración inversa. Es un revert de git.

**`"join"` mueve más bytes en `Profesional.especialidades`** → Es el escenario esperado, no un
imprevisto. Mitigación: el criterio de aceptación de D2 exige medir el tamaño de la respuesta además
del conteo. Si el payload sube, esa query se deja como está. Se documenta como resultado válido, no
como fracaso.

**La instrumentación en producción filtra datos de socios o pacientes a los logs de Vercel** → El
riesgo más serio del change, y el único con consecuencias sobre personas. Mitigación: se registra
`e.query` y `e.duration`, nunca `e.params`; Prisma emite el SQL ya parametrizado. Antes de recorrer
ninguna ruta logueada hay que **verificar en el log de la primera request** que aparecen `$1`, `$2` y
no valores. La variable se apaga apenas termina la medición.

**Se despliega a producción una instrumentación que agrega overhead** → Mitigación: apagada por
defecto y ausente de la configuración. Sin la variable, el binario se comporta como hoy. La
verificación es explícita: primero desplegar con la variable ausente y confirmar que no aparece
ningún log.

**`cache` de React aplicado sobre un dato privado y usado fuera de su alcance** → Si alguien lo
confunde con `unstable_cache`, un perfil de socio podría sobrevivir a la request. Mitigación: la
tabla comparativa de D4 está en el design a propósito, y el spec tiene escenarios explícitos de
aislamiento entre usuarios y de dato modificado entre requests. La verificación es manual y
obligatoria: dos socios distintos, dos sesiones, cada uno ve lo suyo.

**Paralelizar el layout cambia el orden de las lecturas** → Las cuatro lecturas del layout son de
sólo lectura y no comparten estado, así que reordenarlas no cambia el resultado. El riesgo real es
otro: `countUnread` **sí** depende de `findByUserId`, y meterla por descuido en el mismo `Promise.all`
la rompería con un `profesional` indefinido. Mitigación: el `Promise.all` va **después** de resolver
el profesional, y hay que probar explícitamente el caso del usuario autenticado **sin** perfil
profesional vinculado, que el dashboard ya contempla con su pantalla de "Usuario no vinculado".

**Trabajo en paralelo sobre el repositorio** → Aparecieron dos commits de otra procedencia
(`fix(registro)`, `fix(security)`), y hay dos changes abiertos: `perf-db-caching` (18/51) y
`registro-upload-directo` (31/46). Riesgo de conflicto sobre `src/lib/prisma.ts`, que `perf-db-caching`
tocó en su grupo 1. Mitigación: antes de editarlo, confirmar que ninguna tarea pendiente de esos
changes lo toca; `middleware.ts` queda fuera de alcance por la misma razón.

**El conteo en producción resulta ser mucho más bajo de lo que sugiere el baseline de dev** → Es un
resultado posible y **no es un fracaso: es la respuesta a la pregunta que el paso (1) hace**. Si en
`pdx1` co-locado el costo por round-trip es marginal, entonces D1–D2 no valen su riesgo y el change
se recorta a D4 y D5 —que no dependen de ninguna preview— y se documenta por qué. Ese resultado hay
que aceptarlo si aparece, no discutirlo.

## Migration Plan

Cada paso se despliega y se mide **por separado**, para poder atribuir la mejora —o el regreso— a su
causa. Es la misma disciplina que le funcionó a `perf-db-caching` cuando la co-locación de región
explicó el 40%.

1. **Instrumentar y medir el baseline real.** Mover la guarda de `src/lib/prisma.ts` a variable de
   entorno. Desplegar **con la variable ausente** y confirmar que no aparece ningún log. Activarla,
   recorrer las rutas de `/mi-panel` y `/admin`, verificar en la primera request que el log muestra
   `$1`/`$2` y no valores, registrar el conteo de sentencias por ruta en `baseline.md`, apagarla.
   **Sin este paso no se dimensiona nada.**
2. **D4 — paralelizar y deduplicar.** No depende de nada de lo anterior salvo de poder medirlo.
   Desplegar solo. Re-contar `/mi-panel`. Esperado: desaparece la segunda lectura del profesional y
   la cantidad de esperas de reloj del layout baja.
3. **D5 — `/noticias`.** Desplegar solo. Re-contar: un listado y un conteo menos.
4. **D1 — habilitar `relationJoins`.** Desplegar solo. Es **inerte por diseño**: el conteo debe dar
   igual que en (3). Si cambió algo, parar e investigar antes de seguir.
5. **D2 — aplicar `"join"` query por query**, en el orden de la tabla de D2, midiendo conteo y tamaño
   de respuesta entre cada una. Revertir individualmente lo que no cumpla los tres criterios.
6. **D6 — verificación del pooler** (tarea de la usuaria), sólo si tras (5) los `DEALLOCATE ALL`
   siguen siendo significativos.
7. **Medición final** con la metodología de (1), en la misma tabla que el baseline, para comparación
   directa. Reportar explícitamente cualquier ruta que haya empeorado.

**Rollback**, por paso y sin dependencias entre ellos:

| Paso | Cómo se revierte |
|---|---|
| 1 | Quitar la variable de entorno en Vercel. Efecto inmediato, sin redeploy de código. |
| 2, 3 | Revert de git. Cambios acotados a la obtención de datos de tres archivos. |
| 4, 5 | Borrar `relationLoadStrategy` de la query afectada, o `previewFeatures` del generator; `prisma generate`; desplegar. |
| 6 | Quitar el parámetro de la variable de entorno en Vercel. |

**Ninguno de los siete pasos requiere una migración de base, ni tiene rollback destructivo, ni pierde
datos.** Esa es la diferencia central con el grupo 6 de `perf-db-caching` y conviene decirla una vez
más acá.

## Open Questions

- **Cuál es el piso real de latencia por sentencia en `pdx1` co-locado.** La responde el paso (1). No
  bloquea la escritura de las tareas —el orden del trabajo no cambia según el resultado—, pero sí
  bloquea prometer cualquier número.
- **Si `"join"` gana o pierde en `Profesional.especialidades`.** La responde la medición del paso (5)
  sobre esa query puntual. Ambos resultados están contemplados por el criterio de aceptación de D2 y
  ninguno cambia el plan.
- **Si `pgbouncer=true` está presente en `DATABASE_URL`.** La responde la usuaria en el paso (6). El
  change está diseñado para que la respuesta llegue tarde: D6 explica por qué el orden es ese.
