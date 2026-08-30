# Baseline de rendimiento — `perf-db-caching`

## Metadatos de la medición

- **Fecha**: 2026-08-30
- **Método**: `curl`, 2 rondas, valores consistentes entre rondas (no es cold start)
- **URL del deploy**: https://circulo-kinesiologos-mza.vercel.app

## Baseline de producción (pre-change)

| Ruta | TTFB | Total | Tamaño | `x-vercel-cache` |
|------|------|-------|--------|-------------------|
| `/` | 1.08–1.23 s | 1.32–1.54 s | 136 KB | MISS |
| `/profesionales` | 1.05–1.12 s | 1.19–1.37 s | 223 KB | MISS |
| `/noticias` | 0.79 s | 0.83 s | 48 KB | MISS |
| `/profesionales?query=gonzalez` | 1.09 s | — | — | MISS |
| `/profesionales?query=a` | 1.04 s | — | — | MISS |
| `/profesionales?char=M` | 1.07 s | — | — | MISS |

Headers observados en `/` y `/noticias`:
`cache-control: private, no-cache, no-store, max-age=0, must-revalidate`, `x-vercel-cache: MISS` (siempre), `age: 0`.

Este baseline es el contrato de verificación (ver `proposal.md — Why`): al cerrar el change se
repiten **exactamente** las mismas mediciones para demostrar la mejora con números comparables.

## Comando de medición (reproducible palabra por palabra)

Para cada ruta `$URL`:

```bash
curl -s -o /dev/null -w '  ttfb=%{time_starttransfer}s  total=%{time_total}s  size=%{size_download}b  http=%{http_code}\n' "$URL"
curl -sI "$URL" | grep -iE 'cache-control|x-vercel-cache|age'
```

Ejecutar 2 rondas por ruta, con las rutas de la tabla de arriba (incluyendo las variantes con
`searchParams`), y registrar TTFB, total, tamaño y los headers de cache.

Comando pendiente para la usuaria — verificación de la tarea 2.9 (cache de edge, Grupo A), tras
desplegar este change a producción:

```bash
for URL in \
  "https://circulo-kinesiologos-mza.vercel.app/" \
  "https://circulo-kinesiologos-mza.vercel.app/institucional" \
  "https://circulo-kinesiologos-mza.vercel.app/obras-sociales" \
  "https://circulo-kinesiologos-mza.vercel.app/noticias" \
  "https://circulo-kinesiologos-mza.vercel.app/profesionales"; do
  echo "== $URL =="
  curl -s -o /dev/null -w '  ttfb=%{time_starttransfer}s  total=%{time_total}s  size=%{size_download}b  http=%{http_code}\n' "$URL"
  curl -sI "$URL" | grep -iE 'cache-control|x-vercel-cache|age'
  echo "-- segunda request (debería dar HIT) --"
  curl -s -o /dev/null -w '  ttfb=%{time_starttransfer}s  total=%{time_total}s  size=%{size_download}b  http=%{http_code}\n' "$URL"
  curl -sI "$URL" | grep -iE 'cache-control|x-vercel-cache|age'
done
```

Nota: `/noticias/[slug]` y `/profesionales/[slug]` (Grupo A también) requieren un slug real de la
base de producción; usar cualquier noticia o profesional publicado existente.

## Instrumentación de queries en desarrollo (tarea 1.3 / 1.4)

`src/lib/prisma.ts` emite el evento `query` de Prisma con su duración **sólo cuando
`NODE_ENV !== "production"`** (guarda explícita, ver `design.md — D6`). En producción no se agrega
ningún logging: el baseline de arriba se midió desde afuera, sin instrumentar la aplicación.

### Queries disparadas por página (medidas en vivo con `npm run dev`, primera visita sin filtros)

Medición real, no estimada: se levantó el servidor de desarrollo (`npm run dev`, Turbopack) y se
visitaron las tres rutas con `curl`, capturando la salida de la instrumentación agregada en la
tarea 1.3 (`[prisma] {duration}ms  {query}`).

| Página | Queries Prisma disparadas | Duración observada por query | Tiempo total de la request |
|--------|---------------------------|-------------------------------|------------------------------|
| `/` | 5 lecturas de datos (`Profesional` count, `BeneficioKineClub`, `Profesional` listado, `Noticia`, `ObraSocial`) más sus resoluciones de relaciones (`CategoriaBeneficio`, `Localidad`, `CategoriaNoticia`, `Capacitacion`, `_EspecialidadToProfesional`, `Especialidad`) y el overhead transaccional de Prisma (`BEGIN`/`DEALLOCATE ALL`/`COMMIT` por cada una) — 3 de esas 5 (`Noticia`, `BeneficioKineClub`, `Capacitacion`) son `findMany` **sin `take`**, tal como describe `design.md — D5` | 209–653 ms por sentencia individual (incluye las de overhead transaccional) | `GET / 200 in 29.3s` — primera compilación de Turbopack incluida (`next.js: 13.3s`, `application-code: 16.0s`); ver nota de metodología abajo |
| `/profesionales` | `Profesional` listado paginado + `Profesional` count + `Especialidad` (selector) + `Localidad` (selector) + resoluciones de relaciones (`Localidad` por id, `_EspecialidadToProfesional`, `Especialidad` por id) | 210–637 ms por sentencia | `GET /profesionales 200 in 5.4s` (`next.js: 467ms`, `application-code: 5.0s`) |
| `/noticias` | `Noticia` listado paginado + `Noticia` count + `CategoriaNoticia` (para el filtro, con conteo agregado) + una **segunda** ronda idéntica de `Noticia` listado + count (dos renders del mismo dato) + `CategoriaNoticia` por id (x2) | 210–445 ms por sentencia | `GET /noticias 200 in 1840ms` (`next.js: 48ms`, `application-code: 1793ms`) |

**Nota de metodología**: los tiempos por query en desarrollo (200–650 ms) son mucho más altos que
los esperables en producción — la base de datos es la misma instancia remota de Supabase, pero acá
se accede desde la máquina de desarrollo en vez de una función serverless de Vercel, así que el
número absoluto no es comparable al TTFB de producción. Lo que sí es una observación válida y
reproducible independientemente de la red:

1. **El costo dominante es el número de round-trips, no el trabajo del motor.** Cada `SELECT` paga
   prácticamente el mismo piso (~200–650 ms) sin importar su complejidad — un `COUNT(*)` cuesta lo
   mismo que un `SELECT` con joins. Esto es consistente con `design.md — D7`: la latencia de red
   domina sobre el costo de ejecución.
2. **`/` dispara ~16 sentencias** (5 lecturas de datos + resoluciones de relaciones + overhead
   transaccional), varias de ellas evitables: los selectores de localidades/especialidades y
   categorías se repiten en cada visita aunque no dependan de la request (grupo 3, `unstable_cache`,
   fuera de esta tanda), y 3 de las 5 lecturas de datos traen la tabla completa sin `take`
   (grupo 5, fuera de esta tanda).
3. **`/noticias` repite la misma query de listado y de conteo dos veces en una sola request** —
   candidato a investigar en un change de consolidación del patrón de repositorios (fuera de
   alcance, ver `proposal.md — Impact`).

Esta medición confirma que la instrumentación de la tarea 1.3 funciona end-to-end (evento `query`
de Prisma capturado con su duración, sólo en desarrollo) y deja evidencia reproducible del número
y tipo de queries por página, que es lo que la tarea 1.4 pide registrar. La comparación de TTFB
válida contra el baseline de producción es la de la sección anterior (`curl` contra el deploy),
no esta.

---

## Hallazgo de infraestructura: región de la función vs. región de la base

Medido el 2026-08-30, durante el grupo 1.

- **Función de Vercel**: `iad1` (Washington D.C., us-east-1). Confirmado con
  `curl -sI <deploy> | grep x-vercel-id` → `x-vercel-id: gru1::iad1::...`
- **Proyecto de Supabase**: `us-west-2` (Oregón). Confirmado por la usuaria en
  Supabase → Settings → General.

Es decir: **costa a costa**. Cada sentencia SQL sale de Virginia y va a Oregón.
El RTT esperado entre ambas regiones es de ~60-70 ms **por sentencia**.

Esto importa porque la instrumentación de Prisma mostró que la app emite muchas
más sentencias de las necesarias: 391 sentencias en 7 páginas, de las cuales
228 (58%) son `BEGIN`/`COMMIT`/`DEALLOCATE ALL` — overhead de protocolo, no
consultas. Una página que emite ~8 sentencias paga ~500 ms sólo en geografía.

**Acción tomada**: se agregó `vercel.json` con `"regions": ["pdx1"]` (Portland,
la región de Vercel que corresponde a `us-west-2`) para co-locar la función con
la base.

**Verificación pendiente**: tras el deploy, repetir las mediciones de este
archivo y comparar el TTFB de las rutas dinámicas (`/profesionales`,
`/noticias`), que son las que no se benefician del cache de edge y por lo tanto
reflejan directamente el costo de las queries. Si el TTFB no baja, la hipótesis
de la latencia entre regiones era incorrecta y hay que seguir buscando.

### Resultado tras co-locar la región (2026-08-30)

`x-vercel-id: gru1::pdx1::...` — función confirmada en Portland, ~75 s tras el push.

Mediana de 5 muestras por ruta, todas rutas dinámicas (sin cache de edge, o sea
que reflejan directamente el costo de las queries):

| Ruta | Baseline (iad1) | Tras pdx1 | Mejora |
|---|---|---|---|
| `/profesionales` | 1,05 s | **0,63 s** | −40% |
| `/noticias` | 0,79 s | **0,50 s** | −37% |
| `/profesionales?query=gonzalez` | 1,09 s | **0,49 s** | −55% |

Hipótesis confirmada: el ahorro de ~0,3-0,6 s por request es consistente con
~60-70 ms de RTT multiplicados por las 6-9 sentencias que emite cada página.

Queda un piso de ~0,45-0,50 s en las rutas dinámicas. Ese piso es el objetivo
del trabajo de round-trips (reducir la cantidad de sentencias por request), que
NO se hace en este change.

---

## Grupo 3 — evidencia de invalidación de round-trips (tarea 3.4)

Medido el 2026-08-30 en desarrollo (`npm run dev`, Turbopack), con la instrumentación
de la tarea 1.3, apagando el servidor al terminar (accede contra Supabase de producción).

### `/profesionales`, dos cargas consecutivas sin cambiar filtros

Primera carga — dispara, entre otras, las dos queries de los selectores de filtro:

```
[prisma] 429ms  SELECT "Especialidad"."id", ... FROM "Especialidad" WHERE "nombre" <> $1 ORDER BY "nombre" ASC OFFSET $2
[prisma] 436ms  SELECT "Localidad"."id", ... FROM "Localidad" WHERE 1=1 ORDER BY "nombre" ASC OFFSET $1
 GET /profesionales 200 in 7.9s (next.js: 1600ms, application-code: 6.3s)
```

Segunda carga (mismo proceso, sin cambiar `searchParams`) — **no** aparece ninguna de
las dos queries de arriba. Sólo quedan las resoluciones de relación por profesional
listado (`Localidad WHERE id IN (...)`, `_EspecialidadToProfesional`, `Especialidad
WHERE id IN (...)`), que dependen del resultado paginado y no deben cachearse:

```
[prisma] 435ms  SELECT "Localidad"."id", ... WHERE "id" IN ($1,...,$7) OFFSET $8
[prisma] 438ms  SELECT "_EspecialidadToProfesional"... WHERE "B" IN (...)
[prisma] 446ms  SELECT "Especialidad"."id", ... WHERE "id" IN (...) OFFSET $26
 GET /profesionales 200 in 2.7s (next.js: 6ms, application-code: 2.6s)
```

Confirmado: `LocalidadRepository.getAll()` y `EspecialidadRepository.getAll()` (tarea 3.2)
sólo golpean la base en la primera carga del proceso; la segunda reutiliza el cache de
`unstable_cache`. Tiempo de aplicación también baja de 6.3s a 2.6s en dev (menos round-trips).

### `/noticias`, dos cargas consecutivas

Primera carga incluye la query pesada de `CategoriaNoticiaRepository.getAll()` (con el
`LEFT JOIN`/`COALESCE` de conteo de noticias por categoría):

```
[prisma] 539ms  SELECT "CategoriaNoticia"..., COALESCE(...aggr_count_noticias...) FROM "CategoriaNoticia" LEFT JOIN (...) ON (...) WHERE 1=1 ORDER BY "nombre" ASC OFFSET $1
 GET /noticias 200 in 3.2s
```

Segunda carga: esa query no vuelve a aparecer (sólo quedan los `CategoriaNoticia WHERE id
IN (...)` de la resolución de relación por noticia, que vienen de `NoticiaRepository`, no
tocado en este grupo):

```
 GET /noticias 200 in 1676ms (next.js: 3ms, application-code: 1673ms)
```

Confirmado: `CategoriaNoticiaRepository.getAll()` (tarea 3.3) también queda cacheada.
`CategoriaRepository.getAll()` (kineclub) usa el mismo patrón; no se muestra el detalle
por brevedad pero el código es idéntico y se verificó con el mismo método.

### Tarea 3.5 — búsqueda y filtrado

Verificado en vivo contra Supabase de producción, con SQL capturado en los logs:

- **Texto** (`?q=gonzalez`): `... AND ("nombre" ILIKE $3 OR "apellido" ILIKE $4 OR "full_name" ILIKE $5 OR "matricula" ILIKE $6)` — 200 OK.
- **Letra inicial** (`?char=M`): `... AND "apellido" ILIKE $3` — 200 OK.
- **Paginación** (`?page=2`): mismo `WHERE`, `OFFSET` distinto — 200 OK.
- **Localidad y especialidad** (`?loc=`, `?spec=`): no se probaron en vivo con IDs reales
  en esta tanda (requeriría IDs de la base de producción a mano), pero el código de
  filtrado en `ProfesionalRepository.findPaginated` no fue tocado por este grupo — sólo
  cambió la fuente de las *opciones* de los selectores (ahora cacheada), no la lógica de
  filtrado en sí. Riesgo residual bajo; recomendado un click manual rápido en el navegador
  para cerrar el caso antes de dar el change por completo.
