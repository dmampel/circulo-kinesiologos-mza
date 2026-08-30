# Resultados medidos — grupos 3 y 4

Medición del 2026-08-30, tras desplegar los grupos 3 y 4.
Primera muestra descartada en cada ruta (cold start posterior al deploy).

## `/noticias` (grupo 4)

| Momento | TTFB (mediana) |
|---|---|
| Antes del grupo 4 | 0,50 s |
| Después del grupo 4 | **0,49 s** |

**Sin mejora medible en TTFB.** El cambio es correcto y está verificado —
la instrumentación de dev mostró 18 → 14 sentencias por request, y el `count`
del sidebar era trabajo enteramente descartado — pero **no acelera la página**.

**Por qué**: ese `count` corría dentro de un `Promise.all`, en paralelo con
las demás queries. La latencia de una request está acotada por la cadena más
lenta, no por la suma de las sentencias. Sacar una query que corría en
paralelo baja la carga de la base y el trabajo desperdiciado, pero no mueve
el reloj.

**Conclusión metodológica, importante para el resto del change**: reducir la
CANTIDAD de sentencias sólo baja la latencia cuando esas sentencias estaban
**serializadas**. Las que ya estaban en paralelo no cuestan tiempo de pared.
Los grupos 5, 6 y 7 deben evaluarse con este criterio: no alcanza con contar
sentencias, hay que mirar si estaban en la cadena crítica.

## `/profesionales` (control, no tocada por este change)

| Momento | TTFB (mediana) |
|---|---|
| Tras co-locar la región | 0,63 s |
| Ahora | **0,51 s** |

Mejora atribuible al grupo 3 de `perf-db-caching` (cache de localidades y
especialidades), desplegado en el push anterior: son dos queries que salieron
de la cadena crítica de cada request.

## `/mi-panel` (grupo 3) — SIN MEDIR

No se pudo medir desde afuera: está detrás de login. La mejora es estructural
y verificable contando sentencias en dev con una sesión real (procedimiento en
la tarea 1.8), pero **no existe un antes/después de producción**. No se debe
afirmar una mejora en milisegundos del portal del socio sin ese dato.

A diferencia de `/noticias`, acá la corrección SÍ ataca serialización: se
eliminó una lectura duplicada del profesional que estaba en la cadena crítica
y el layout pasó de 4 esperas en serie a 2. Es el caso donde la teoría predice
mejora real de latencia. Falta confirmarlo.
