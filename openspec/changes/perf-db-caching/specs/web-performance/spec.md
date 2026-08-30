## Purpose

Define la política de rendimiento del sitio: qué páginas pueden servirse desde cache y con qué
ventana de staleness, qué rutas ejecutan la verificación de sesión, qué límites obligatorios tienen
las queries de lectura, cómo se indexa la base, y el protocolo de medición que respalda cualquier
afirmación de mejora de performance.

## ADDED Requirements

### Requirement: Las páginas públicas SHALL servirse desde cache

Toda página de acceso público —es decir, aquella cuyo contenido no depende de la sesión del
visitante— MUST ser cacheable por el edge de Vercel mediante revalidación temporal
(`export const revalidate = <N>`). Ninguna página pública MUST declarar `export const dynamic = "force-dynamic"`.

Un visitante anónimo que solicita una página pública ya cacheada MUST recibir la respuesta desde
el edge, sin render en el origin ni consultas a la base de datos.

#### Scenario: Segunda visita anónima dentro de la ventana de revalidación

- **GIVEN** una página pública que fue solicitada y cacheada hace menos de `N` segundos
- **WHEN** un visitante anónimo la solicita nuevamente
- **THEN** la respuesta se sirve desde el edge, se reporta como `x-vercel-cache: HIT`, y no se
  ejecuta ninguna consulta a la base de datos

#### Scenario: Primera visita tras expirar la ventana

- **GIVEN** una página pública cuya entrada de cache superó los `N` segundos
- **WHEN** un visitante anónimo la solicita
- **THEN** el contenido se regenera en el origin, se vuelve a cachear, y las visitas subsiguientes
  dentro de la ventana se sirven desde el edge

#### Scenario: Header de cache permisivo

- **WHEN** se inspeccionan los headers de respuesta de cualquier página pública
- **THEN** el header `cache-control` NO contiene `no-store` ni `private`

### Requirement: Las páginas dependientes de sesión SHALL permanecer dinámicas

Toda página cuyo contenido dependa de la identidad del usuario autenticado —en particular la
totalidad de `/admin` y de `/mi-panel`— MUST renderizarse por request y MUST NOT declarar
`revalidate`. Estas páginas MUST conservar `export const dynamic = "force-dynamic"`.

Ningún contenido generado para un usuario autenticado MUST ser servido a otro usuario ni
almacenado en un cache compartido.

#### Scenario: Página de administración

- **GIVEN** una administradora que modifica un registro desde `/admin`
- **WHEN** vuelve a cargar la página de listado correspondiente
- **THEN** ve el estado actualizado inmediatamente, sin ventana de staleness

#### Scenario: Aislamiento entre usuarios autenticados

- **GIVEN** dos profesionales distintos con sesión iniciada
- **WHEN** cada uno accede a `/mi-panel`
- **THEN** cada uno recibe únicamente sus propios datos, y ninguna respuesta de `/mi-panel` es
  almacenada en un cache compartido entre usuarios

### Requirement: La verificación de sesión SHALL limitarse a las rutas que la requieren

El middleware que valida la sesión de Supabase Auth MUST ejecutarse en todas las rutas protegidas
y en las rutas de autenticación que necesitan refrescar cookies de sesión. MUST NOT ejecutarse en
las rutas públicas de sólo lectura ni en assets estáticos.

Acotar el alcance del middleware MUST NOT dejar ninguna ruta protegida sin control de acceso: la
protección de `/admin` y `/mi-panel` debe ser exactamente equivalente antes y después del cambio.

#### Scenario: Visitante anónimo en ruta pública

- **GIVEN** un visitante sin sesión
- **WHEN** solicita una página pública
- **THEN** la respuesta se produce sin realizar ninguna llamada a Supabase Auth

#### Scenario: Visitante anónimo intenta acceder a ruta protegida

- **GIVEN** un visitante sin sesión
- **WHEN** solicita cualquier ruta bajo `/admin` o `/mi-panel`
- **THEN** es redirigido a `/login`

#### Scenario: Usuario autenticado sin rol de administrador

- **GIVEN** un usuario con sesión válida cuyo rol en `app_metadata` no es `admin`
- **WHEN** solicita cualquier ruta bajo `/admin`
- **THEN** es redirigido a `/mi-panel`

#### Scenario: Refresco de sesión de Supabase

- **GIVEN** un usuario autenticado cuyo token de acceso está próximo a expirar
- **WHEN** navega a una ruta protegida
- **THEN** el middleware refresca la sesión y persiste las cookies actualizadas en la respuesta,
  sin cerrar la sesión del usuario

### Requirement: Las queries de lectura SHALL estar acotadas

Ninguna consulta de lectura que alimente una vista MUST traer una tabla completa cuando la vista
consume sólo un subconjunto. Los criterios de filtrado y el límite de cantidad MUST aplicarse en la
consulta a la base de datos, no en memoria después de recibir los resultados.

#### Scenario: Selección de las noticias más recientes publicadas

- **GIVEN** una tabla de noticias donde las publicaciones más recientes por fecha están sin publicar
- **WHEN** el home solicita las últimas noticias publicadas
- **THEN** recibe las noticias publicadas más recientes, y la cantidad de filas leídas de la base
  no supera el límite solicitado

#### Scenario: Selección de beneficios activos

- **GIVEN** una tabla de beneficios que contiene registros activos e inactivos
- **WHEN** el home solicita los beneficios destacados
- **THEN** recibe únicamente beneficios activos, y la cantidad de filas leídas de la base no supera
  el límite solicitado

### Requirement: El schema SHALL declarar índices sobre las columnas de filtro y orden

El schema de base de datos MUST declarar índices sobre las claves foráneas y sobre las columnas
utilizadas de forma recurrente para filtrar y ordenar resultados. Cada índice declarado MUST
corresponder a un patrón de consulta existente en el código.

MUST NOT agregarse índices especulativos: un índice sin una consulta que lo justifique impone
costo de escritura y de almacenamiento sin beneficio.

Las migraciones que crean índices MUST ser aditivas y reversibles: no modifican, eliminan ni
renombran columnas, tablas ni relaciones.

#### Scenario: Índice justificado por una consulta existente

- **WHEN** se agrega un índice al schema
- **THEN** existe al menos una consulta en el código que filtra u ordena por esa columna

#### Scenario: Reversión de la migración

- **GIVEN** una migración que crea índices aplicada en la base
- **WHEN** se revierte
- **THEN** los índices se eliminan y no se pierde ningún dato

### Requirement: Las mejoras de performance SHALL demostrarse con mediciones comparables

Toda afirmación de mejora de rendimiento MUST estar respaldada por una medición previa (baseline) y
una medición posterior obtenidas con el mismo método, sobre las mismas rutas y sobre el mismo
entorno desplegado.

Las métricas mínimas MUST ser el TTFB por ruta y el estado del cache de edge (`x-vercel-cache`).

#### Scenario: Verificación posterior a la implementación

- **GIVEN** el baseline de producción registrado en la propuesta
- **WHEN** se completa la implementación y se despliega
- **THEN** se repiten las mismas mediciones sobre las mismas rutas y se registran los resultados
  junto al baseline, permitiendo la comparación directa

#### Scenario: Regresión detectada

- **WHEN** una medición posterior muestra un TTFB peor que el baseline en alguna ruta
- **THEN** el resultado se reporta explícitamente en lugar de omitirse, y la causa se investiga
  antes de dar el trabajo por terminado
