## Why

El change `perf-db-caching` bajó el costo de las páginas **públicas** con dos palancas medidas: el
cache de edge (`/` de 1,08 s a 0,21 s con `x-vercel-cache: HIT`) y la co-locación de la función de
Vercel con la base (`/profesionales` de 1,05 s a 0,63 s al pasar de `iad1` a `pdx1`). Ninguna de las
dos sirve para `/admin` ni para `/mi-panel`: son datos privados por usuario, **no se pueden cachear
nunca**, y ya están co-locadas. Para el portal del socio y el backoffice —lo que la usuaria reportó
explícitamente como lento— la única vía de mejora que queda es **emitir menos sentencias SQL por
request**.

La instrumentación de Prisma (evento `query`, agregada en el grupo 1 de `perf-db-caching`)
navegando `/mi-panel/*` y `/admin/*` logueada dejó el diagnóstico:

| Métrica | Valor |
|---|---|
| Sentencias en ~7 páginas | **391** |
| Tiempo total en base | 123.393 ms |
| Media / p50 / p90 / max por sentencia | 315,6 / 227 / 460 / 918 ms |
| Sentencias que son **puro overhead de protocolo** | **228 (58%)** — 76 `BEGIN`, 76 `COMMIT`, 76 `DEALLOCATE ALL` |
| Tiempo consumido por esas 228 sentencias triviales | **51.756 ms — el 42% de todo el tiempo de base** |
| Sentencia más rápida de todas, de cualquier tipo | **210 ms** (un `BEGIN`, que no hace nada, midió 224 ms) |

Distribución de los `SELECT` por tabla: `Profesional` 20, `Localidad` 16, `Especialidad` 16,
`_EspecialidadToProfesional` 15, `InscripcionCapacitacion` 9, `CategoriaBeneficio` 9,
`BeneficioKineClub` 9, `Circular` 7, `Turno` 6, `LecturaCircular` 6, `Capacitacion` 6, `Sorteo` 5,
`ObraSocial` 4, `InscripcionSorteo` 4, `Solicitud` 3.

### CAVEAT METODOLÓGICO — leer antes de citar cualquier número de arriba

Ese piso de 210 ms por sentencia se midió **desde la laptop de la usuaria (Mendoza, Argentina)
contra Supabase remoto**. NO son los números de producción: en producción la función corre en
`pdx1`, co-locada con la base en `us-west-2`, donde el RTT es de milisegundos, no de centenas.
**Este change no promete ninguna mejora en milisegundos basada en esa medición.**

Lo que sí es independiente del entorno, porque es arquitectura y no red:

- la **cantidad** de sentencias por página (391 en ~7 páginas), y
- el **ratio de 58%** de sentencias que son overhead de protocolo en vez de consultas.

Reducir 8 sentencias a 3 ahorra 5 round-trips **en cualquier entorno**; lo único que cambia entre
entornos es cuánto vale cada round-trip. Por eso la **primera tarea del change es re-medir el piso
real desde producción**, antes de dimensionar cualquier ganancia. Cualquier afirmación de mejora se
respalda contra ese baseline nuevo, no contra la tabla de arriba.

### Causa raíz (verificada en el código, no asumida)

`prisma/schema.prisma` declara el generator sin `previewFeatures`:

```prisma
generator client {
  provider = "prisma-client-js"
}
```

Sin `relationJoins`, `relationLoadStrategy` queda en su default `"query"`: cada `include` resuelve
sus relaciones con **queries separadas envueltas en una transacción** en vez de un JOIN. De ahí
salen los 76 `BEGIN`/`COMMIT`.

Evidencia que calza con la hipótesis:

- `ProfesionalRepository.findPaginated` usa `include: { localidad: true, especialidades: true }`, y
  la distribución muestra `Profesional` 20 / `Localidad` 16 / `Especialidad` 16 /
  `_EspecialidadToProfesional` 15 — cada relación resuelta por su cuenta.
- Verificación directa: `grep -c relationLoadStrategy node_modules/.prisma/client/index.d.ts`
  devuelve **0**. El cliente generado hoy ni siquiera expone la opción, que es exactamente lo
  esperable con la preview apagada. Esto da un criterio de aceptación binario y barato.
- `relationJoins` **existe** en la versión instalada: aparece en
  `node_modules/prisma/build/index.js` y en `node_modules/@prisma/client/generator-build/index.js`
  (Prisma 6.19.3). No hay que actualizar Prisma.

### Segunda causa raíz, encontrada durante esta investigación y NO prevista en el diagnóstico inicial

El conteo de sentencias es sólo la mitad del problema. La otra mitad es que **las sentencias que
sobreviven se ejecutan en serie**, aunque no dependan unas de otras.

`src/app/mi-panel/layout.tsx` —que corre en **todas** las páginas de `/mi-panel/*`— hace cuatro
`await` consecutivos, sin `Promise.all`:

1. `ProfesionalRepository.findByUserId(user.id)` (con `include: { localidad, especialidades }`)
2. `CircularRepository.countUnread(profesional.id)` — depende de (1)
3. `SorteoRepository.getLatestActive()` — **no depende de nada**, es un `findFirst` con `select: { createdAt }`
4. `CapacitacionRepository.getLatestPublicada()` — **no depende de nada**, ídem

(3) y (4) son independientes entre sí y de (2): las tres podrían ir en un solo `Promise.all` y
costar un round-trip de reloj en vez de tres.

Peor todavía en el dashboard: `src/app/mi-panel/page.tsx` vuelve a llamar
**`ProfesionalRepository.findByUserId(user.id)` con el mismo argumento que ya ejecutó el layout en
la misma request**, y encadena otros seis `await` en serie
(`BeneficioRepository.findRandom`, `CircularRepository.getAllPublishedWithStatus`,
`CapacitacionRepository.getProximasInscripcionesSocio`, `TurnoRepository.autoCompletarPasados`
—que además es una **escritura** en cada carga del dashboard—, `TurnoRepository.getByProfesionalAndWeek`).
También llama `supabase.auth.getUser()` por segunda vez. Contando layout más page, `/mi-panel`
paga del orden de **once round-trips serializados** antes de renderizar.

Por contraste, `src/app/admin/page.tsx` ya está bien resuelto: agrupa sus ocho consultas en un
`Promise.all`. Sirve como el patrón de referencia a replicar, no como problema.

Esta causa es **complementaria y ortogonal** a la de `relationJoins`: una reduce cuántas sentencias
se emiten, la otra reduce cuántas esperas se pagan de a una. Atacar sólo la primera dejaría la
mitad de la mejora sobre la mesa.

### El hallazgo de `/noticias`: causa identificada

`baseline.md` de `perf-db-caching` dejó anotado que `/noticias` ejecuta su query de listado y su
conteo **dos veces** en la misma request, con la hipótesis de "layout y page llamando al mismo
repositorio, o doble render". **La hipótesis era incorrecta y la causa real es más simple.**

`src/app/noticias/page.tsx` llama `NoticiaRepository.getPaginated` **dos veces** dentro del mismo
`Promise.all`:

```ts
const [noticiasRes, categorias, ultimasNoticias] = await Promise.all([
  NoticiaRepository.getPaginated(currentPage, 12, categoriaSlug, busqueda), // la grilla
  CategoriaNoticiaRepository.getAll(),
  NoticiaRepository.getPaginated(1, 5),                                     // el sidebar "Últimas noticias"
]);
```

`getPaginated` corre internamente `findMany` **más** `count`. Como el sidebar la reutiliza sólo para
traer 5 items, la request paga **dos listados y dos conteos**. El segundo `count` es trabajo
íntegramente tirado: nada lee `total` ni `totalPages` de `ultimasNoticias`. Y en la carga por
defecto (página 1, sin filtros) los dos `count` son además **idénticos**.

No es un problema de doble render de Next ni del layout. Es un método de repositorio usado para un
caso de uso que no es el suyo. La corrección es acotada: un método `getUltimas(limit)` sin conteo.

## What Changes

Ordenado por relación evidencia/riesgo, no por tamaño:

1. **Re-medir desde producción (primero, y bloqueante para prometer números).** Establecer el piso
   real de latencia por sentencia y el conteo de sentencias por ruta con la función ya en `pdx1`.
   Requiere resolver cómo obtener el conteo en producción: la instrumentación actual de
   `src/lib/prisma.ts` está **guardada por entorno** (`NODE_ENV !== "production"`), a propósito. El
   diseño elige entre habilitarla detrás de una variable de entorno explícita y temporal, o contar
   sentencias contra una base equivalente desde una función co-locada. Sin esta tarea no se
   dimensiona nada.
2. **Evaluar `relationJoins` + `relationLoadStrategy: "join"` en los caminos calientes con
   `include`.** Habilitar la preview en el generator y aplicar la estrategia `join` **query por
   query, midiendo cada una**, no como default global. La decisión y su fundamento se resuelven en
   `design.md`.
3. **Paralelizar y deduplicar los round-trips que ya no se pueden eliminar.** Agrupar en
   `Promise.all` los `await` independientes de `src/app/mi-panel/layout.tsx`, y eliminar la
   duplicación de `findByUserId` entre layout y page mediante deduplicación a nivel request. Es el
   cambio de mayor impacto esperado sobre `/mi-panel` y **no depende de ninguna preview feature**.
4. **Investigar los 76 `DEALLOCATE ALL`.** Aparecen cuando Prisma limpia prepared statements, típico
   al usar un pooler en modo transacción. Hay que verificar si `DATABASE_URL` lleva `pgbouncer=true`
   (o el parámetro equivalente de Supabase). **Es una verificación para la usuaria: este change no
   lee `.env` ni transcribe credenciales.** Ver la nota de secuenciación abajo — puede resolverse
   solo.
5. **Eliminar la query duplicada de `/noticias`.** Método `getUltimas(limit)` en
   `NoticiaRepository`, sin `count`, para el sidebar. Elimina un listado y dos conteos por request.
6. **Medición posterior con la misma metodología**, comparando contra el baseline de (1) para
   demostrar la mejora con números comparables.

### Nota de secuenciación sobre (4)

Los tres contadores del overhead son **exactamente iguales**: 76 `BEGIN`, 76 `COMMIT`, 76
`DEALLOCATE ALL`. Esa igualdad no es casual — indica que el `DEALLOCATE ALL` se emite una vez por
transacción, es decir que está atado a las mismas transacciones que (2) busca eliminar. Si
`relationLoadStrategy: "join"` convierte esas transacciones en una sola sentencia, **los
`DEALLOCATE ALL` deberían caer en la misma proporción sin tocar la cadena de conexión.**

Por eso (4) se ejecuta **después** de (2) y de re-contar: si el conteo ya bajó, la verificación de
`pgbouncer=true` pasa de ser un arreglo a ser higiene de configuración. Invertir el orden llevaría a
tocar la cadena de conexión de producción para perseguir un síntoma que otro cambio ya curó.

### Cambios de schema de base de datos

- `prisma/schema.prisma` se modifica en **una sola línea**: agregar
  `previewFeatures = ["relationJoins"]` al bloque `generator client`. **No se agregan, eliminan ni
  renombran columnas, tablas, relaciones ni índices.**
- **No se genera ninguna migración Prisma y no se ejecuta `prisma migrate` de ningún tipo.** El
  bloque `datasource db` no se toca. `relationJoins` cambia únicamente **la generación del cliente
  y el SQL que se emite en runtime**; el esquema físico de la base queda idéntico.
- **No se requieren migraciones de Supabase.** Supabase se usa acá para Auth y Storage; ninguna de
  las dos superficies cambia. No se tocan políticas RLS, buckets ni configuración de Auth.
- **Distinción explícita frente al grupo 6 diferido de `perf-db-caching`** (índices): aquel grupo
  fue diferido porque aplicaba una migración `CREATE INDEX` contra la base de producción —una
  operación con riesgo real sobre datos. **Este change no hace nada de eso.** Un rollback acá es
  borrar una línea del schema, regenerar el cliente y desplegar. No confundir ambos riesgos.

## Capabilities

### New Capabilities

- `database-round-trips`: política sobre cuántas sentencias SQL puede emitir una request y cómo se
  emiten — estrategia de carga de relaciones de Prisma, obligación de paralelizar las lecturas
  independientes, deduplicación de lecturas repetidas entre layout y page dentro de una misma
  request, configuración de la conexión al pooler, y el protocolo de conteo de sentencias por ruta
  que respalda cualquier afirmación de mejora.

### Modified Capabilities

Ninguna. Este change **no altera ningún comportamiento observable por el usuario**: las mismas
páginas muestran los mismos datos. Lo que cambia es cuántas sentencias SQL cuesta producirlos.

Nota deliberada sobre `web-performance`: esa capability es introducida por el change **en curso**
`perf-db-caching` y todavía **no existe** en `openspec/specs/`. Declararla acá como "Modified"
crearía una dependencia de orden de archivado entre dos changes abiertos y muy probablemente
rompería `openspec validate`. `database-round-trips` se declara como capability nueva y hermana,
acotada a una preocupación distinta —cuántas sentencias emite una request, no qué se cachea ni cómo
se indexa—. Si al archivar ambos changes se prefiere fusionarlas, es una decisión de archivado y se
resuelve ahí.

## Impact

**Código afectado**

- `prisma/schema.prisma` — una línea: `previewFeatures = ["relationJoins"]` en el generator.
- `src/lib/repositories/ProfesionalRepository.ts` — `findPaginated`, `findBySlug`, `findByUserId`,
  `findByEmail`, `findByMatricula`: candidatas a `relationLoadStrategy` explícito, una por una.
- `src/lib/repositories/NoticiaRepository.ts` — método `getUltimas(limit)` nuevo, sin `count`.
- `src/app/noticias/page.tsx` — consumir `getUltimas` en el sidebar en vez de `getPaginated(1, 5)`.
- `src/app/mi-panel/layout.tsx` — agrupar los `await` independientes en `Promise.all`.
- `src/app/mi-panel/page.tsx` — dejar de repetir `findByUserId` (y `supabase.auth.getUser()`) que el
  layout ya resolvió en la misma request; agrupar los `await` independientes.
- `src/lib/prisma.ts` — habilitación acotada y reversible de la instrumentación para poder contar
  sentencias en producción durante la medición. **Superficie sensible**: hoy la guarda por entorno
  es intencional (`design.md — D6` de `perf-db-caching`).
- Otros repositorios con `include` en caminos calientes (`CircularRepository`,
  `CapacitacionRepository`, `TurnoRepository`, `SorteoRepository`) — sólo si la medición por query
  lo justifica.

**Sistemas**

- Cliente Prisma generado: cambia el SQL emitido para las queries con `include` afectadas. **No
  cambia el esquema físico de la base.**
- Vercel: nuevo deploy; sin cambios de configuración de región ni de cache.
- Supabase Auth y Storage: sin cambios.
- `DATABASE_URL`: **posible** agregado de `pgbouncer=true` si la verificación (4) lo revela faltante
  **y** el conteo posterior a (2) muestra que todavía hace falta. Cambio de configuración de
  entorno, ejecutado por la usuaria, no por el agente.

**Gobernanza: MEDIO.** No hay migración de schema, no hay cambios de datos, no hay superficie de
auth ni de permisos. Pero toca **cómo se emite cada query de la aplicación**, así que la
verificación tiene que ser amplia y no puntual: se recorren todas las rutas de `/mi-panel` y
`/admin`, no sólo las que se editaron. Implementación por pasos con checkpoints, y las decisiones
no obvias —sobre todo la de opt-in por query vs. default global— se elevan a la usuaria.

**Fuera de alcance (explícito)**

- **Grupo 6 de `perf-db-caching` (índices).** Sigue diferido con su justificación medida. No se
  retoma acá. El disparador para retomarlo es justamente el resultado de este change: si tras
  reducir los round-trips la ejecución de queries queda como el costo dominante.
- **Consolidación del patrón de repositorios.** 17 archivos de `src/app` importan `@/lib/prisma`
  directo y saltean la capa de repositorios; `src/app/admin/page.tsx` es uno de ellos. Es un change
  aparte. Acá el diseño **la roza** en un punto y hay que decirlo: la deduplicación de lecturas por
  request se implementa en la capa de repositorios, así que las páginas que consultan Prisma directo
  no se benefician de ella. No es motivo para consolidar ahora; es motivo para no sorprenderse
  después.
- **`BeneficioRepository.findRandom`** trae la tabla `BeneficioKineClub` completa y la baraja en
  JavaScript. Es un problema real, pero es exactamente el patrón que ya tiene dueño en el grupo 5 de
  `perf-db-caching` (tarea 5.3). No se toca acá para no pisar ese change.
- **`TurnoRepository.autoCompletarPasados`** ejecuta un `updateMany` en cada carga del dashboard del
  socio. Se documenta como hallazgo; corregirlo es un cambio de comportamiento (cuándo se
  auto-completan los turnos), no de rendimiento, y merece su propio change.
- **Cachear `/admin` o `/mi-panel`.** Prohibido por la capability `web-performance` de
  `perf-db-caching` y por sentido común: son datos privados por usuario.
- El change abierto `registro-upload-directo` (31/46 tareas) no se toca.
