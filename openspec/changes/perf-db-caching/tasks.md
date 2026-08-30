> Orden de ejecución por impacto medido (ver `design.md — Migration Plan`). Los grupos se despliegan
> y miden de a uno para poder atribuir la mejora a cada causa. Dentro de cada grupo se respeta el
> orden de capas del proyecto: DB/Prisma → Supabase → Backend → Frontend.

## 1. Medición e instrumentación

- [x] 1.1 Registrar el baseline de producción en `openspec/changes/perf-db-caching/baseline.md`, copiando la tabla de `proposal.md — Baseline de producción` y anotando fecha, método (`curl`, 2 rondas) y URL del deploy
- [x] 1.2 Guardar el comando exacto de medición (TTFB por ruta + header `x-vercel-cache`) en ese mismo archivo, para que la verificación posterior sea reproducible palabra por palabra
- [x] 1.3 Configurar el cliente Prisma en `src/lib/prisma.ts` para emitir el evento `query` con su duración **sólo cuando `NODE_ENV !== "production"`**, respetando el patrón singleton existente
- [x] 1.4 Ejecutar la app en desarrollo, visitar `/`, `/profesionales` y `/noticias`, y registrar en `baseline.md` la duración de cada query disparada por cada página

## 2. Cache de edge en rutas públicas sin `searchParams` (prioridad 1 — Frontend)

- [x] 2.1 En `src/app/page.tsx`: eliminar `export const dynamic = "force-dynamic"` y agregar `export const revalidate = 300`
- [x] 2.2 En `src/app/institucional/page.tsx`: eliminar `force-dynamic` y agregar `export const revalidate = 3600`
- [x] 2.3 En `src/app/obras-sociales/page.tsx`: eliminar `force-dynamic` y subir el `revalidate` existente de 60 a 3600
- [x] 2.4 En `src/app/noticias/[slug]/page.tsx`: eliminar `force-dynamic` y agregar `export const revalidate = 3600`
- [x] 2.5 En `src/app/profesionales/[slug]/page.tsx`: eliminar `force-dynamic` y agregar `export const revalidate = 3600`
- [x] 2.6 En `src/app/sitemap.ts`: eliminar `force-dynamic` y agregar `export const revalidate = 3600`
- [x] 2.7 Verificar con `grep -rl 'force-dynamic' src/app` que quedan exactamente 46 archivos: los 43 de `/admin` y `/mi-panel` más los 3 del Grupo B, que se tratan en el grupo 3
- [x] 2.8 Confirmar que **ninguna** página bajo `/admin` ni `/mi-panel` fue modificada en este grupo (`git diff --name-only` no debe listar rutas de esos directorios)
- [x] 2.9 Desplegar y medir: repetir las mediciones de 1.2 y confirmar `x-vercel-cache: HIT` en la segunda request de cada ruta del grupo, y que `cache-control` ya no contiene `no-store` ni `private` — **HECHO (2026-08-30)**: `x-vercel-cache: HIT` confirmado en `/`, `/institucional`, `/obras-sociales` y `/sitemap.xml`; `no-store` ya no aparece. Resultados en `baseline.md`.

## 3. Rutas públicas con `searchParams` (Backend + Frontend)

- [ ] 3.1 En `src/app/profesionales/page.tsx`, `src/app/noticias/page.tsx` y `src/app/kineclub/page.tsx`: eliminar `export const dynamic = "force-dynamic"` (es redundante — leer `searchParams` ya fuerza render dinámico)
- [ ] 3.2 Envolver la lectura de localidades y especialidades que alimenta los filtros de `/profesionales` en el cache de datos de Next (`unstable_cache`) con una etiqueta y TTL, manteniendo el acceso detrás de la capa de repositorios
- [ ] 3.3 Envolver de la misma forma la lectura de categorías que alimenta los filtros de `/noticias` y `/kineclub`
- [ ] 3.4 Verificar en desarrollo, con los logs de query de 1.3, que una recarga de `/profesionales` sin cambiar filtros ya no dispara las queries de localidades ni de especialidades
- [ ] 3.5 Confirmar que la búsqueda y el filtrado siguen funcionando: por texto, por localidad, por especialidad, por letra inicial y por paginación

## 4. Alcance del middleware de sesión (Supabase)

- [ ] 4.1 **Precondición de seguridad**: auditar los layouts de `/admin` y `/mi-panel` y confirmar que cada uno valida la sesión por su cuenta, sin depender exclusivamente del middleware. Si alguno depende sólo del middleware, **detenerse y reportarlo** antes de continuar
- [ ] 4.2 Verificar que el change abierto `registro-upload-directo` no modifica `middleware.ts` ni las rutas de auth, para evitar un conflicto
- [ ] 4.3 Acotar el `matcher` de `middleware.ts` según la enumeración de `design.md — D4`: dentro quedan `/admin/:path*`, `/mi-panel/:path*` y las rutas de auth (`/login`, `/registro`, callback y recuperación de contraseña); fuera quedan las rutas públicas de sólo lectura y los assets
- [ ] 4.4 Probar que un visitante anónimo que solicita `/admin` y `/mi-panel` sigue siendo redirigido a `/login`
- [ ] 4.5 Probar que un usuario autenticado sin rol `admin` que solicita `/admin` sigue siendo redirigido a `/mi-panel`
- [ ] 4.6 Probar el ciclo completo de sesión —login, navegación entre rutas protegidas, recarga, logout— y confirmar que no hay deslogueos inesperados ni bucles de redirección
- [ ] 4.7 Desplegar y medir sólo este cambio: comparar el TTFB de `/noticias` contra el baseline para cuantificar cuánto del piso de ~0.79 s provenía del middleware

## 5. Queries de lectura acotadas (DB/Prisma + Backend)

- [ ] 5.1 En `NoticiaRepository.getLatest()`: **primero** agregar `where: { publicada: true }`, **después** agregar `take`. El orden importa — invertirlo introduce un bug silencioso (ver `design.md — D5`)
- [ ] 5.2 Ajustar `src/app/page.tsx` para dejar de filtrar noticias por `publicada` y de cortar con `.slice(0, 3)` en memoria, ya que ahora lo resuelve la query
- [ ] 5.3 Agregar a `BeneficioRepository` un método nuevo acotado para el home que filtre `activa: true`, ordene por `createdAt desc` y limite la cantidad. **No modificar `getAll()`**: lo consume `/kineclub`, que necesita el conjunto completo de la categoría
- [ ] 5.4 Agregar a `CapacitacionRepository` un método nuevo acotado para el home que filtre `publicada: true` y `fechaInicio >= ahora`, ordene por `fechaInicio asc` y limite la cantidad. **No modificar `findPublicadas()`**: lo consume `/mi-panel/capacitaciones`, que necesita todas
- [ ] 5.5 Actualizar `src/app/page.tsx` para usar los dos métodos nuevos y eliminar el filtrado y el `.slice()` en memoria correspondientes
- [ ] 5.6 Verificar el caso de borde de noticias: con las 3 noticias más recientes marcadas como no publicadas, el home debe mostrar las 3 publicadas más recientes y **no** una sección vacía
- [ ] 5.7 Verificar el caso de borde equivalente en beneficios y en capacitaciones
- [ ] 5.8 Confirmar que `/kineclub` y `/mi-panel/capacitaciones` siguen mostrando el conjunto completo que mostraban antes
- [ ] 5.9 Confirmar con los logs de query que el home ya no lee las tablas completas de noticias, beneficios ni capacitaciones

## 6. Índices de base de datos (DB/Prisma — gobernanza HIGH)

- [ ] 6.1 Agregar a `prisma/schema.prisma` únicamente los 12 bloques `@@index` de la tabla de `design.md — D3`. No agregar, eliminar ni renombrar columnas, tablas ni relaciones
- [ ] 6.2 Generar la migración con `prisma migrate dev` **contra una base de desarrollo**, nunca contra producción
- [ ] 6.3 Revisar a mano el SQL generado y confirmar que contiene **sólo** sentencias `CREATE INDEX`. Si aparece cualquier `ALTER`, `DROP` o `UPDATE`, detenerse y reportar: el schema divergió de la base
- [ ] 6.4 **Presentar el SQL a la usuaria y esperar aprobación explícita antes de tocar producción.** No aplicar sin ese visto bueno
- [ ] 6.5 Documentar el rollback en la propia migración o junto a ella: el `DROP INDEX` de cada índice creado
- [ ] 6.6 Aplicar en producción con `prisma migrate deploy` en horario de bajo tráfico, y verificar que los índices existen y que la aplicación responde
- [ ] 6.7 Medir de nuevo las rutas de búsqueda del padrón y registrar el resultado, aunque la mejora sea marginal — el objetivo declarado de estos índices es preventivo, no correctivo

## 7. Verificaciones de infraestructura (para la usuaria — sin cambios de código)

- [ ] 7.1 Verificar si `DATABASE_URL` usa el pooler de Supabase (puerto 6543 con `pgbouncer=true`) o conexión directa (5432), y registrar el hallazgo. **No leer ni transcribir credenciales** — sólo el puerto y la presencia del parámetro
- [ ] 7.2 Verificar en qué región corren las funciones de Vercel y en qué región está el proyecto Supabase, y registrar si coinciden
- [ ] 7.3 Registrar cuántos profesionales se renderizan por página en `/profesionales` y evaluar si los 223 KB de HTML se explican por ese tamaño de página o por markup redundante. Documentar el hallazgo; **no optimizar el payload en este change**
- [ ] 7.4 Si 7.1 o 7.2 revelan una configuración subóptima, documentarla como candidata a un change aparte en lugar de arreglarla acá

## 8. Verificación final y cierre

- [ ] 8.1 Repetir la medición completa de 1.2 sobre las 6 rutas del baseline y registrar los resultados junto a los originales, en la misma tabla, para comparación directa
- [ ] 8.2 Confirmar `x-vercel-cache: HIT` en la segunda request de cada ruta del Grupo A
- [ ] 8.3 Reportar explícitamente cualquier ruta cuyo TTFB haya empeorado respecto del baseline, e investigar la causa antes de dar el change por terminado
- [ ] 8.4 Confirmar que `/admin` y `/mi-panel` siguen siendo dinámicas, protegidas y sin staleness: modificar un registro desde el admin y verlo reflejado de inmediato
- [ ] 8.5 Ejecutar la suite de tests existente (`vitest`) y confirmar que no hay regresiones, prestando atención a `src/lib/repositories/ProfesionalRepository.test.ts`
- [ ] 8.6 Registrar en el resumen del change si `pg_trgm` sigue sin justificarse, aplicando el disparador definido en `design.md — D3`
