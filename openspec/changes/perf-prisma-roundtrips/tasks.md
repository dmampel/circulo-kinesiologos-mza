> Los grupos se despliegan y se miden **de a uno**, para poder atribuir cada mejora —o cada regreso—
> a su causa. Es la disciplina que en `perf-db-caching` permitió atribuirle el 40% a la co-locación de
> región. Dentro de cada grupo se respeta el orden de capas del proyecto: DB/Prisma → Supabase →
> Backend → Frontend.
>
> **El grupo 1 es bloqueante.** Hasta tenerlo, no se dimensiona ninguna ganancia ni se promete ningún
> número. Ver `proposal.md — CAVEAT METODOLÓGICO` y `design.md — D3`.
>
> Si hay que recortar el change, **lo que se conserva son los grupos 3 y 4**: son los de mayor
> impacto esperado sobre `/mi-panel`, no dependen de ninguna preview feature y su rollback es un
> revert de git (`design.md — D4`, nota de precedencia).

## 1. Medición del baseline real en producción (Backend — BLOQUEANTE)

- [ ] 1.1 Verificar, antes de tocar `src/lib/prisma.ts`, que ninguna tarea pendiente de `perf-db-caching` ni de `registro-upload-directo` modifica ese archivo. Si alguna lo hace, **detenerse y reportarlo** (`design.md — Risks`, trabajo en paralelo)
- [ ] 1.2 En `src/lib/prisma.ts`: reemplazar la guarda `NODE_ENV !== "production"` por una guarda sobre una variable de entorno explícita (p. ej. `PRISMA_QUERY_LOG`), **ausente por defecto**. Registrar únicamente `e.query` y `e.duration`; **nunca `e.params`** (`design.md — D3`)
- [ ] 1.3 Confirmar en local que sin la variable no se emite ningún log, y que con la variable el log aparece con el SQL parametrizado (`$1`, `$2`, …) y **sin valores**
- [ ] 1.4 Desplegar a producción **con la variable ausente** y confirmar que no aparece ningún registro por query en los logs de Vercel. Este es el estado seguro por defecto
- [ ] 1.5 Activar la variable en Vercel y, en la **primera** request logueada, verificar en el log que aparecen `$1`/`$2` y no datos de socios ni de pacientes. Si aparece cualquier valor real, **apagar la variable de inmediato y detenerse**
- [ ] 1.6 Recorrer logueada las rutas de `/mi-panel` (`/mi-panel`, `/mi-panel/circulares`, `/mi-panel/capacitaciones`, `/mi-panel/turnos`, `/mi-panel/perfil`, `/mi-panel/sorteos`, `/mi-panel/carnet`) y las principales de `/admin` (`/admin`, `/admin/profesionales`, `/admin/noticias`, `/admin/solicitudes`), capturando el log de cada una
- [ ] 1.7 Registrar en `openspec/changes/perf-prisma-roundtrips/baseline.md` una tabla por ruta con: total de sentencias, cuántas son consultas (`SELECT`/`INSERT`/`UPDATE`/`DELETE`), cuántas son overhead (`BEGIN`, `COMMIT`, `ROLLBACK`, `DEALLOCATE ALL`), el porcentaje de overhead, y la duración por sentencia como contexto —**no** como criterio (`design.md — D3`)
- [ ] 1.8 Anotar en `baseline.md` el comando y el procedimiento exactos usados, palabra por palabra, para que la medición final del grupo 8 sea reproducible y comparable
- [ ] 1.9 **Apagar la variable de entorno** en Vercel al terminar la captura, y confirmar que los logs vuelven a estar limpios
- [ ] 1.10 Comparar el conteo de producción contra el de desarrollo registrado en `perf-db-caching/baseline.md` (391 sentencias / 58% de overhead) y anotar explícitamente **cuánto del piso de 210 ms era de la red de la laptop**. Si el conteo de producción resulta marginal, **detenerse y reportar**: puede que los grupos 5 y 6 no valgan su riesgo y el change deba recortarse a los grupos 3 y 4 (`design.md — Risks`, último ítem)

## 2. Verificación de infraestructura (Supabase — tarea de la usuaria, sin cambios de código)

- [ ] 2.1 La usuaria verifica en el `DATABASE_URL` del proyecto de Vercel **sólo dos cosas**: el puerto (`6543` = pooler en modo transacción, `5432` = conexión directa) y si la query string incluye `pgbouncer=true`. **No leer, transcribir ni pegar el string completo, ni usuario, ni contraseña, ni host** (`design.md — D6`)
- [ ] 2.2 Registrar el hallazgo en `baseline.md` en la forma "puerto 6543, `pgbouncer=true` ausente" o equivalente, sin ninguna credencial
- [ ] 2.3 **No actuar sobre el hallazgo todavía.** La decisión de agregar el parámetro se toma en el grupo 7, después de re-contar los `DEALLOCATE ALL` — ver `design.md — D6` para por qué el orden es ese

## 3. Deduplicación y paralelización del portal del socio (Backend + Frontend — mayor impacto esperado)

- [x] 3.1 Envolver `ProfesionalRepository.findByUserId` con `cache` de React (`import { cache } from "react"`), en la capa de repositorios, no en los llamadores (`design.md — D4b`)
- [x] 3.2 Envolver de la misma forma la resolución de identidad de Supabase Auth que hoy repiten el layout y el dashboard, de modo que `supabase.auth.getUser()` se resuelva una sola vez por request
- [x] 3.3 Verificar que se usó `cache` de **React** y **no** `unstable_cache` ni `use cache`: son datos privados por socio y no pueden sobrevivir a la request ni compartirse entre usuarios (`design.md — D4`, tabla comparativa)
- [x] 3.4 En `src/app/mi-panel/layout.tsx`: resolver `ProfesionalRepository.findByUserId` primero y agrupar `CircularRepository.countUnread`, `SorteoRepository.getLatestActive` y `CapacitacionRepository.getLatestPublicada` en un único `Promise.all` **posterior**. `countUnread` depende del profesional — meterla en un `Promise.all` anterior la rompe (`design.md — Risks`)
- [x] 3.5 En `src/app/mi-panel/page.tsx`: agrupar en `Promise.all` los `await` que no dependen entre sí, respetando las dependencias reales sobre `profesional.id`
- [x] 3.6 Confirmar que el JSX de ambos archivos quedó **intacto**: si el diff toca markup, `className` o componentes, se salió de alcance (`design.md — D7`)
- [ ] 3.7 Probar el caso del usuario autenticado **sin** perfil profesional vinculado: el dashboard debe seguir mostrando la pantalla "Usuario no vinculado" y no romper con un `profesional` indefinido
- [x] 3.8 Probar el aislamiento entre socios: dos profesionales distintos, dos sesiones, cada uno ve únicamente sus propios datos, circulares y turnos — **VERIFICADO por la usuaria el 2026-08-30**: dos socios en sesiones distintas, cada uno vio únicamente sus propios datos. Sin cruce.
- [ ] 3.9 Probar que un dato modificado se refleja de inmediato: editar el perfil desde `/mi-panel/perfil`, recargar, y confirmar que el cambio aparece —la memoización no debe sobrevivir a la request
- [ ] 3.10 Probar el control de acceso sin cambios: un anónimo que pide `/mi-panel` es redirigido a `/login`; un autenticado sin rol `admin` que pide `/admin` es redirigido a `/mi-panel`
- [ ] 3.11 Desplegar **solo este grupo** y re-contar las rutas de `/mi-panel` con el procedimiento de 1.8. Esperado: desaparece la segunda lectura del profesional y baja la cantidad de esperas serializadas del layout. Registrar en `baseline.md`

## 4. Query duplicada de `/noticias` (Backend + Frontend)

- [x] 4.1 Agregar `NoticiaRepository.getUltimas(limit)`: `findMany` con `include: { categoria: true }`, `orderBy: { publicada_en: "desc" }` y `take`, **sin `count`** (`design.md — D5`)
- [x] 4.2 **No modificar `getPaginated`.** La grilla sí necesita el total para paginar
- [x] 4.3 En `src/app/noticias/page.tsx`: reemplazar `NoticiaRepository.getPaginated(1, 5)` del sidebar "Últimas noticias" por `getUltimas(5)`, dejando intacta la llamada de la grilla
- [x] 4.4 Confirmar que el sidebar muestra las mismas 5 noticias, en el mismo orden, con la misma fecha y la misma imagen que antes
- [x] 4.5 Confirmar que la paginación de la grilla sigue siendo correcta: navegar entre páginas, filtrar por categoría y buscar por texto
- [ ] 4.6 Desplegar **solo este grupo** y re-contar `/noticias`. Esperado: un listado y un conteo menos por request. Registrar en `baseline.md`

## 5. Habilitar `relationJoins` (DB/Prisma — cambio inerte por diseño)

- [x] 5.1 En `prisma/schema.prisma`, agregar `previewFeatures = ["relationJoins"]` al bloque `generator client`. **Ese es el único cambio del archivo en todo el change**: no se agregan, eliminan ni renombran modelos, campos, relaciones, enums ni `@@index`, y el bloque `datasource db` no se toca (`design.md — D1`)
- [x] 5.2 **VERIFICADO 2026-09-03**: `grep -c relationLoadStrategy` pasó de `0` a `190`. Ejecutar `npx prisma generate` y verificar con `grep -c "relationLoadStrategy" node_modules/.prisma/client/index.d.ts` que el conteo pasó de `0` a un número mayor que cero. Si sigue en `0`, el paso falló: **detenerse**
- [x] 5.3 Confirmar que **no** se generó ninguna migración y que no se ejecutó `prisma migrate dev`, `prisma migrate deploy` ni `prisma db push`. `git status` no debe listar nada bajo `prisma/migrations/`
- [x] 5.4 **VERIFICADO 2026-09-03**: `npx tsc --noEmit` sin errores y `npx vitest run` 19/19 archivos, 149/149 tests. Ejecutar `npx tsc --noEmit` y confirmar que la regeneración del cliente no rompió ningún tipo
- [ ] 5.5 Desplegar **solo este grupo**. Es inerte por diseño: `relationLoadStrategy` sigue en su default `"query"` hasta que una query pida otra cosa
- [ ] 5.6 Re-contar las rutas y confirmar que el conteo es **idéntico** al del grupo 4. Si cambió algo, **detenerse e investigar** antes de seguir

## 6. Aplicar `relationLoadStrategy: "join"` query por query (DB/Prisma + Backend)

> Opt-in por query, **nunca** como default del cliente (`design.md — D2`). Cada query se acepta sólo
> si cumple **las tres** condiciones: (a) baja el conteo de sentencias, (b) no sube sensiblemente el
> tamaño de la respuesta, (c) el resultado es idéntico, incluidas las filas con relaciones vacías.
> Si (a) se cumple pero (b) no, **la query se deja como estaba y se anota por qué** — es un resultado
> válido, no un fracaso.

- [ ] 6.1 Aplicar `relationLoadStrategy: "join"` a `ProfesionalRepository.findByUserId` (corre en todas las páginas del portal vía el layout). Medir conteo y tamaño de respuesta antes/después
- [ ] 6.2 Verificar el caso de borde: un profesional **sin localidad asignada** y **sin ninguna especialidad** debe seguir apareciendo, con sus relaciones nulas o vacías, y no quedar excluido
- [ ] 6.3 Evaluar contra los tres criterios y decidir: conservar o revertir. Registrar la decisión y su número en `baseline.md`
- [ ] 6.4 Repetir 6.1–6.3 sobre `ProfesionalRepository.findBySlug` (una sola fila; el riesgo de cardinalidad casi no aplica)
- [ ] 6.5 Repetir 6.1–6.3 sobre `ProfesionalRepository.findPaginated` (12 filas × `localidad` + `especialidades`). **Es el caso de mayor ganancia potencial y de mayor riesgo de payload**: medir el tamaño de la respuesta de `/profesionales` con especial atención, contra los 223 KB registrados en `perf-db-caching/baseline.md`
- [ ] 6.6 Repetir 6.1–6.3 sobre `NoticiaRepository.getPaginated` (`categoria`, to-one puro)
- [ ] 6.7 Decidir si se sigue con `CircularRepository`, `CapacitacionRepository`, `TurnoRepository` y `SorteoRepository`, **o si se para acá**. No hay obligación de llegar: se para en cuanto el retorno deje de justificar el riesgo. Documentar la decisión
- [ ] 6.8 Confirmar que **ninguna** escritura que requiera atomicidad perdió su transacción: la reducción de overhead no se logra a costa de la consistencia
- [ ] 6.9 Desplegar y re-contar. Registrar en `baseline.md` el conteo por ruta y, en particular, **cuántos `DEALLOCATE ALL` quedan** — es la entrada del grupo 7

## 7. Decisión sobre la configuración del pooler (Supabase — sólo si sigue haciendo falta)

- [ ] 7.1 Comparar el conteo de `DEALLOCATE ALL` de 6.9 contra el del baseline de 1.7. Si cayó en proporción a los `BEGIN`/`COMMIT`, la hipótesis de `design.md — D6` se confirma: **cerrar el grupo acá y anotarlo**
- [ ] 7.2 Sólo si los `DEALLOCATE ALL` siguen siendo significativos **y** 2.2 registró `pgbouncer=true` ausente: presentarle a la usuaria la recomendación de agregar el parámetro, explicando qué hace y cómo se revierte
- [ ] 7.3 El cambio de la variable de entorno lo aplica **la usuaria** en Vercel, con su propio redeploy. **No es una edición de código de este change** y no se hace sin su visto bueno explícito
- [ ] 7.4 Si se aplicó, re-contar y registrar el efecto sobre los `DEALLOCATE ALL` en `baseline.md`

## 8. Verificación final y cierre

- [ ] 8.1 Repetir la medición completa del grupo 1 sobre las mismas rutas, con el procedimiento de 1.8, y registrar los resultados **en la misma tabla** que el baseline, para comparación directa
- [ ] 8.2 Confirmar que las consultas reales son ahora mayoría sobre las sentencias de overhead, y anotar la proporción final contra el 58% de partida
- [ ] 8.3 Reportar explícitamente **cualquier ruta que emita más sentencias** que en el baseline, e investigar su causa antes de dar el change por terminado
- [ ] 8.4 **Apagar la variable de instrumentación** en Vercel y confirmar que los logs quedan limpios. No debe quedar encendida entre mediciones
- [ ] 8.5 Recorrer todas las rutas de `/mi-panel` y `/admin` —no sólo las editadas— y confirmar que muestran la misma información, con el mismo orden y la misma paginación que antes. La gobernanza MEDIO exige verificación amplia, no puntual
- [ ] 8.6 Confirmar que `/admin` y `/mi-panel` siguen siendo dinámicas y sin staleness: modificar un registro desde el admin y verlo reflejado de inmediato
- [ ] 8.7 Confirmar que las rutas públicas cacheadas por `perf-db-caching` siguen dando `x-vercel-cache: HIT` en la segunda request: este change no debe haber roto el cache de edge
- [ ] 8.8 Ejecutar `npx vitest run` y confirmar que no hay regresiones, con atención a `src/lib/repositories/ProfesionalRepository.test.ts` —que hoy afirma `include: { localidad: true, especialidades: true }`— y a `src/lib/repositories/TurnoRepository.test.ts`
- [ ] 8.9 Ejecutar `npx tsc --noEmit` y `npm run build`, y confirmar que ambos pasan
- [ ] 8.10 Registrar en el resumen del change si el grupo 6 de `perf-db-caching` (índices) sigue sin justificarse: su disparador declarado es que, tras reducir los round-trips, la **ejecución** de las queries quede como el costo dominante. Este change es el que produce esa evidencia
