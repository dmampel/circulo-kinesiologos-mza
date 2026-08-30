## Why

El sitio público tarda ~1.1s de TTFB en cada visita. La medición en producción
(https://circulo-kinesiologos-mza.vercel.app) muestra la causa dominante: **no hay
ningún tipo de cache**. Las 52 páginas de `src/app` declaran `export const dynamic = "force-dynamic"`,
por lo que Vercel responde `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`
y `x-vercel-cache: MISS` en el 100% de las requests. Cada visitante anónimo que entra al home
dispara un render SSR completo y 5 queries a la base de Supabase, para devolver contenido que es
idéntico para todos.

Además existe un **piso fijo de ~0.79s** presente incluso en la página más liviana
(`/noticias`, 48 KB, pocas queries), que no se explica por el costo de las consultas y que
sospechamos proviene del middleware de Supabase Auth corriendo en toda request y/o de la
latencia de conexión Prisma→Supabase en serverless.

Este change ataca las causas **medidas**, en orden de impacto comprobado.

### Baseline de producción (2 rondas de `curl`, valores consistentes — no es cold start)

| Ruta | TTFB | Total | Tamaño | `x-vercel-cache` |
|------|------|-------|--------|------------------|
| `/` | 1.08–1.23 s | 1.32–1.54 s | 136 KB | MISS |
| `/profesionales` | 1.05–1.12 s | 1.19–1.37 s | 223 KB | MISS |
| `/noticias` | 0.79 s | 0.83 s | 48 KB | MISS |
| `/profesionales?query=gonzalez` | 1.09 s | — | — | MISS |
| `/profesionales?query=a` | 1.04 s | — | — | MISS |
| `/profesionales?char=M` | 1.07 s | — | — | MISS |

Headers observados en `/` y `/noticias`:
`cache-control: private, no-cache, no-store, max-age=0, must-revalidate`, `x-vercel-cache: MISS`, `age: 0`.

Este baseline es el contrato de verificación: al cerrar el change se repiten **exactamente**
las mismas mediciones (TTFB por ruta + `x-vercel-cache`) para demostrar la mejora con números comparables.

### Lo que la medición corrigió respecto del diagnóstico inicial

- **Los índices NO son el cuello de botella hoy.** Se presumía que el `ILIKE '%texto%'` del
  padrón dominaba el tiempo. La medición lo desmiente: `?query=gonzalez` (1.09 s) tarda lo mismo
  que la página sin filtros (1.05 s). Con el volumen actual del padrón el seq scan no domina.
  Los índices se incluyen igual, pero **como higiene y prevención de crecimiento, no como el fix
  del problema medido** — y por eso se limitan a B-tree sobre FKs y columnas de filtro/orden.
- **Se descarta React Query.** El fetching es 100% server-side; React Query es un cache de cliente
  y adoptarlo obligaría a pasar páginas a `"use client"` + API routes, agregando un waterfall de
  red y perdiendo el SEO del contenido renderizado en servidor.
- **Se difiere `pg_trgm` + GIN.** Sin evidencia de que el ILIKE sea el cuello de botella, instalar
  una extensión y construir un índice GIN contra la base de producción es riesgo sin retorno medido.
  Queda documentado como trabajo futuro con su disparador explícito.

## What Changes

Ordenado por impacto medido, de mayor a menor:

1. **Cache de edge en páginas públicas (prioridad 1).** Reemplazar `force-dynamic` por
   `export const revalidate = <N>` en las 9 rutas públicas que hoy lo declaran. Un visitante
   anónimo debe recibir un HIT de edge (`x-vercel-cache: HIT`) en vez de un render de origin.
   Las 43 páginas bajo `/admin` (26) y `/mi-panel` (17) **mantienen `force-dynamic`**: son
   por definición per-request y un `revalidate` mal puesto ahí le mostraría datos viejos a la usuaria.
2. **Reducir el piso fijo de ~0.79 s.** Acotar el `matcher` de `middleware.ts` para que
   `updateSession` (round-trip a Supabase Auth) corra sólo en las rutas que realmente necesitan
   sesión, y verificar la configuración de conexión Prisma→Supabase (pooler vs. directa, región
   de la función de Vercel vs. región del proyecto Supabase).
3. **Acotar las queries que traen tablas enteras.** `NoticiaRepository.getLatest()` y
   `BeneficioRepository.getAll()` hacen `findMany` sin `take` y el filtrado (`publicada`, `activa`)
   ocurre en JavaScript después de traer la tabla completa. Se empuja el filtro al `where` y
   se agrega `take`. **El orden importa**: agregar `take` sin mover primero el filtro al `where`
   introduce un bug (si las 3 noticias más recientes están sin publicar, el home queda vacío).
4. **Índices B-tree en `prisma/schema.prisma` + migración.** El schema tiene 19 modelos y
   **cero `@@index`**. Se agregan índices sobre FKs y columnas de filtro/orden efectivamente usadas.
   Preventivo, no correctivo.
5. **Instrumentación de medición.** Logs de queries de Prisma en desarrollo para tener el costo
   por query, complementando el baseline de TTFB de producción.
6. **Verificaciones documentadas** (sin cambio de código asociado): configuración de `DATABASE_URL`
   y tamaño del payload de `/profesionales` (223 KB de HTML).

### Cambios de schema de base de datos

- `prisma/schema.prisma`: se agregan bloques `@@index` a los modelos afectados. **No se agregan,
  eliminan ni renombran columnas, tablas ni relaciones.**
- Se genera una migración Prisma nueva. Es aditiva y reversible (un índice se borra con `DROP INDEX`
  sin pérdida de datos).
- **No se requieren migraciones de Supabase.** Supabase se usa acá sólo para Auth y Storage; ninguna
  de las dos superficies cambia. No se tocan políticas RLS, buckets ni configuración de Auth.
- La migración corre contra la base de **producción**: gobernanza HIGH. El plan de ejecución,
  la justificación índice-por-índice y el rollback se definen en `design.md` y requieren
  aprobación explícita antes de aplicarse.

## Capabilities

### New Capabilities
- `web-performance`: política de caching y revalidación del sitio público, alcance del middleware
  de sesión, límites obligatorios en las queries de lectura, estrategia de indexado de la base y
  el protocolo de medición (baseline + verificación) que respalda cualquier afirmación de mejora.

### Modified Capabilities
- `home-presentation`: el home pasa de datos frescos por request a datos cacheados con
  revalidación temporal (ventana de staleness acotada y explícita), y la selección de "hasta 3
  noticias publicadas / 3 beneficios activos" pasa de filtrarse en JavaScript sobre la tabla
  completa a resolverse en la query. El resultado visible debe ser equivalente; se agregan
  escenarios de borde que hoy no están cubiertos.

## Impact

**Código afectado**
- `src/app/page.tsx`, `src/app/profesionales/page.tsx`, `src/app/profesionales/[slug]/page.tsx`,
  `src/app/noticias/page.tsx`, `src/app/noticias/[slug]/page.tsx`, `src/app/kineclub/page.tsx`,
  `src/app/institucional/page.tsx`, `src/app/obras-sociales/page.tsx`, `src/app/sitemap.ts`
  — reemplazo de `force-dynamic` por `revalidate`.
- `middleware.ts` — acotamiento del `matcher`. **Superficie sensible a seguridad.**
- `src/lib/repositories/NoticiaRepository.ts`, `src/lib/repositories/BeneficioRepository.ts`
  — filtros al `where` + `take`.
- `src/lib/prisma.ts` — instrumentación de logging.
- `prisma/schema.prisma` + `prisma/migrations/` — índices.

**Sistemas**
- Base de datos Postgres de Supabase (producción) — creación de índices.
- Vercel edge cache — pasa de MISS permanente a servir contenido cacheado.
- Supabase Auth — menos invocaciones por reducción del alcance del middleware.

**Fuera de alcance (explícito)**
- Consolidación del patrón de repositorios: 17 archivos de `src/app` importan `@/lib/prisma`
  directo y saltean la capa de repositorios. Es un change aparte. Acá sólo se respeta el patrón
  en las queries que ya se tocan.
- Extensión `pg_trgm` + índice GIN para búsqueda por substring. Diferido por falta de evidencia.
- Reducción del payload HTML de `/profesionales`: se investiga y se documenta, no se implementa.
- El change abierto `registro-upload-directo` (31/46 tareas) no se toca.
