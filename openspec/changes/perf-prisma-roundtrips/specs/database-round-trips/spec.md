## Purpose

Define cuántas sentencias SQL puede costar una request y cómo deben emitirse: qué proporción del
tiempo de base puede irse en overhead de protocolo en vez de en consultas, la obligación de resolver
en paralelo las lecturas que no dependen entre sí, la prohibición de repetir la misma lectura dos
veces dentro de una request, y el protocolo de conteo de sentencias por ruta que respalda cualquier
afirmación de mejora. Aplica sobre todo a `/admin` y `/mi-panel`, que por ser datos privados por
usuario no pueden cachearse y no tienen ninguna otra vía de mejora disponible.

## ADDED Requirements

### Requirement: El conteo de sentencias por ruta SHALL ser observable

El sistema MUST poder reportar, para una ruta dada, cuántas sentencias SQL emite al atenderla y
cuánto dura cada una, distinguiendo las consultas reales (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) de
las sentencias de overhead de protocolo (`BEGIN`, `COMMIT`, `ROLLBACK`, `DEALLOCATE ALL`).

Esta observabilidad MUST poder activarse en el entorno donde efectivamente corre la aplicación en
producción, porque una medición tomada desde otro entorno no es comparable. MUST estar apagada por
defecto y MUST activarse mediante un interruptor explícito y reversible, nunca de forma permanente:
la instrumentación por query agrega overhead en cada invocación serverless, que es justamente lo que
esta capability busca reducir.

Ninguna sentencia registrada MUST incluir valores de parámetros, credenciales, ni datos personales
de socios o pacientes: se registra la forma de la sentencia y su duración, no su contenido.

#### Scenario: Conteo de sentencias en producción con la instrumentación activada

- **GIVEN** la aplicación desplegada en producción, co-locada con la base
- **AND** el interruptor de instrumentación activado explícitamente
- **WHEN** se solicita una ruta cualquiera de `/mi-panel` o de `/admin`
- **THEN** queda registrada la lista de sentencias emitidas para atender esa request, cada una con
  su duración, clasificable entre consultas y overhead de protocolo

#### Scenario: La instrumentación está apagada por defecto

- **GIVEN** un despliegue de producción sin el interruptor de instrumentación activado
- **WHEN** se solicita cualquier ruta
- **THEN** no se emite ningún registro por query y la aplicación no paga el overhead de la
  instrumentación

#### Scenario: La instrumentación no filtra datos sensibles

- **GIVEN** la instrumentación activada
- **WHEN** se atiende una request que consulta datos de un socio o de un paciente
- **THEN** el registro contiene la forma de la sentencia y su duración, y NO contiene los valores de
  los parámetros, ni credenciales, ni datos personales

### Requirement: Las mejoras de round-trips SHALL demostrarse contra un baseline del mismo entorno

Toda afirmación de mejora de rendimiento derivada de esta capability MUST respaldarse comparando dos
mediciones tomadas **con la misma metodología y en el mismo entorno**: una antes del cambio y otra
después.

Una medición tomada desde una máquina de desarrollo contra una base remota MUST NOT usarse para
dimensionar la ganancia esperable en producción, porque el costo por round-trip difiere en órdenes
de magnitud entre ambos entornos. Esa medición SÓLO es válida como evidencia de la **cantidad** de
sentencias y de su **proporción** entre consultas y overhead, magnitudes que no dependen de la red.

La métrica primaria de esta capability MUST ser el **conteo de sentencias por ruta**, no el tiempo
absoluto: el conteo es atribuible al cambio, mientras que el tiempo absoluto depende de factores
—región, carga de la base, estado del pooler— que el cambio no controla.

#### Scenario: Afirmación de mejora respaldada

- **GIVEN** un cambio que busca reducir los round-trips de una ruta
- **WHEN** se afirma que la ruta mejoró
- **THEN** existe un conteo de sentencias previo y uno posterior para esa misma ruta, tomados con la
  misma metodología y en el mismo entorno, y la afirmación cita ambos

#### Scenario: Medición de desarrollo usada fuera de su alcance

- **GIVEN** una medición tomada desde una máquina de desarrollo contra la base remota
- **WHEN** se la quiere usar para prometer una mejora en milisegundos en producción
- **THEN** el uso es inválido, y la única conclusión que la medición sostiene es sobre la cantidad de
  sentencias y la proporción de overhead

#### Scenario: Ruta que empeora

- **GIVEN** la medición posterior de todas las rutas alcanzadas
- **WHEN** alguna ruta emite más sentencias que en el baseline
- **THEN** el regreso se reporta explícitamente y se investiga su causa antes de dar el trabajo por
  terminado

### Requirement: El overhead de protocolo SHALL ser una fracción minoritaria de las sentencias

Para una ruta cualquiera, las sentencias que no son consultas —`BEGIN`, `COMMIT`, `ROLLBACK`,
`DEALLOCATE ALL`— MUST representar una fracción minoritaria del total de sentencias emitidas al
atenderla.

El estado medido de partida es de 228 sentencias de overhead sobre 391 totales (58%) en unas siete
páginas de `/mi-panel` y `/admin`: la mayoría del tráfico contra la base no son consultas. Ese estado
MUST revertirse, de modo que las consultas reales sean mayoría.

Una consulta que sólo lee datos y no los modifica MUST NOT quedar envuelta en una transacción por el
solo hecho de traer relaciones asociadas. Las transacciones que sí subsistan MUST corresponder a
operaciones que genuinamente necesiten atomicidad.

#### Scenario: Lectura con relaciones asociadas

- **GIVEN** una consulta de sólo lectura que además trae los datos de una o más relaciones
- **WHEN** se cuentan las sentencias que emite
- **THEN** no aparece un par `BEGIN`/`COMMIT` envolviéndola por el mero hecho de resolver esas
  relaciones

#### Scenario: Proporción de overhead tras el cambio

- **GIVEN** el conteo de sentencias por ruta tomado después del cambio, en el mismo entorno que el
  baseline
- **WHEN** se calcula qué proporción del total son sentencias de overhead de protocolo
- **THEN** las consultas reales son mayoría, y la proporción de overhead es sensiblemente menor que
  el 58% del baseline

#### Scenario: Escritura que sí requiere atomicidad

- **GIVEN** una operación que modifica más de una tabla y debe aplicarse por completo o no aplicarse
- **WHEN** se cuentan las sentencias que emite
- **THEN** la transacción que la envuelve se conserva: la reducción de overhead MUST NOT lograrse a
  costa de la atomicidad

### Requirement: Las lecturas independientes de una request SHALL resolverse en paralelo

Dentro de la atención de una misma request, dos lecturas cuyo resultado no sea entrada de la otra
MUST emitirse concurrentemente y no una después de la otra. Una lectura MUST esperar a otra
únicamente cuando necesite su resultado como argumento.

Esto aplica tanto dentro de una página como dentro de un layout, y es especialmente exigible en los
layouts: un layout se ejecuta en todas las páginas que envuelve, así que cada espera innecesaria que
contenga se paga en todas ellas.

#### Scenario: Layout del portal del socio

- **GIVEN** el layout que envuelve todas las páginas del portal del socio, que necesita los datos del
  profesional, su cantidad de circulares sin leer, y las marcas de tiempo del último sorteo y de la
  última capacitación
- **WHEN** se atiende una request a cualquier página del portal
- **THEN** las lecturas que no dependen unas de otras se emiten concurrentemente, y el costo de
  espera del layout es el de la lectura más lenta, no la suma de todas

#### Scenario: Lectura que sí depende de otra

- **GIVEN** una lectura que necesita como argumento el identificador que devuelve una lectura previa
- **WHEN** se atiende la request
- **THEN** la segunda lectura espera a la primera, y esa espera es legítima

### Requirement: Una request SHALL NOT repetir la misma lectura

Cuando dos partes distintas de la misma request —típicamente un layout y la página que envuelve—
necesitan exactamente el mismo dato con exactamente los mismos argumentos, ese dato MUST leerse de la
base una sola vez y reutilizarse. La segunda solicitud MUST resolverse sin emitir sentencias
adicionales.

Esta reutilización MUST estar acotada al ámbito de una única request: dos requests distintas, aunque
sean del mismo usuario, MUST realizar cada una su propia lectura. Los datos de `/mi-panel` y de
`/admin` son privados por usuario y MUST NOT compartirse entre requests, entre usuarios, ni
almacenarse en ningún cache compartido.

Lo mismo aplica a la verificación de sesión contra Supabase Auth: si el layout ya resolvió la
identidad del usuario para esta request, la página que envuelve MUST NOT volver a resolverla contra
Supabase Auth en esa misma request.

#### Scenario: Layout y página piden el mismo dato

- **GIVEN** un layout que lee el perfil del profesional autenticado
- **AND** la página que envuelve, que necesita ese mismo perfil, para el mismo usuario, en la misma
  request
- **WHEN** se atiende la request
- **THEN** el perfil se lee de la base una sola vez, y la segunda solicitud no emite sentencias
  adicionales

#### Scenario: Aislamiento entre requests y entre usuarios

- **GIVEN** dos profesionales distintos con sesión iniciada, o el mismo profesional cargando la
  página dos veces
- **WHEN** cada request se atiende
- **THEN** cada una realiza sus propias lecturas y recibe únicamente los datos que le corresponden,
  sin reutilizar nada leído en otra request

#### Scenario: Dato modificado entre dos requests

- **GIVEN** una profesional que actualiza su perfil desde el portal
- **WHEN** vuelve a cargar cualquier página del portal
- **THEN** ve el estado actualizado de inmediato, porque la reutilización no sobrevive al fin de la
  request

#### Scenario: Verificación de sesión repetida

- **GIVEN** un layout que ya verificó la identidad del usuario contra Supabase Auth en esta request
- **WHEN** la página que envuelve necesita saber quién es el usuario
- **THEN** reutiliza la identidad ya resuelta, sin un segundo round-trip a Supabase Auth

#### Scenario: Sesión ausente o inválida

- **GIVEN** una request sin sesión válida
- **WHEN** el layout intenta resolver la identidad del usuario
- **THEN** la redirección a `/login` ocurre igual que antes, y la reutilización dentro de la request
  MUST NOT convertir una sesión ausente o expirada en una sesión aparentemente válida

### Requirement: Un método de lectura SHALL NO ejecutar trabajo que su llamador no consume

Un método de acceso a datos MUST NOT emitir sentencias cuyo resultado el llamador descarta. En
particular, un método que devuelve una página de resultados junto con el total de registros MUST NOT
usarse cuando el llamador sólo necesita los resultados: para ese caso MUST existir un método que no
calcule el total.

#### Scenario: Listado lateral de últimas noticias

- **GIVEN** la página pública de noticias, que muestra una grilla paginada y además una lista lateral
  con las últimas noticias
- **WHEN** se atiende la request
- **THEN** el listado lateral no dispara un conteo de registros, porque no muestra paginación
- **AND** la request emite un solo conteo en total, el de la grilla paginada

#### Scenario: La paginación de la grilla sigue funcionando

- **GIVEN** la página pública de noticias con más resultados de los que entran en una página
- **WHEN** la visitante navega entre páginas, filtra por categoría o busca por texto
- **THEN** la cantidad de páginas y los controles de navegación siguen siendo correctos

### Requirement: La configuración de conexión SHALL evitar round-trips desperdiciados

La configuración de la conexión a la base MUST ser coherente con el modo en que opera el pooler de
Supabase. Cuando la aplicación se conecta a través de un pooler en modo transacción, el cliente MUST
estar configurado para no depender de sentencias preparadas con nombre, de modo que no gaste
round-trips preparando y liberando sentencias en cada checkout de conexión.

La verificación de esta configuración MUST realizarse sin leer, transcribir ni registrar
credenciales: se comprueba únicamente la presencia del parámetro correspondiente y el puerto, nunca
usuario, contraseña ni host completo.

#### Scenario: Verificación de la cadena de conexión

- **GIVEN** la configuración de conexión del entorno de producción
- **WHEN** se verifica si la aplicación se conecta a través del pooler en modo transacción y si el
  parámetro correspondiente está presente
- **THEN** el hallazgo queda registrado indicando sólo el puerto y la presencia o ausencia del
  parámetro, sin ninguna credencial

#### Scenario: Sentencias de liberación de prepared statements

- **GIVEN** el conteo de sentencias por ruta tomado después del cambio
- **WHEN** se cuentan las sentencias `DEALLOCATE ALL`
- **THEN** su cantidad se reporta junto con la de `BEGIN` y `COMMIT`, y si sigue siendo significativa
  se atribuye a la configuración de conexión y no a la estrategia de carga de relaciones

### Requirement: La reducción de round-trips SHALL preservar el comportamiento observable

Ningún cambio motivado por esta capability MUST alterar lo que la usuaria ve. Las mismas páginas MUST
mostrar los mismos datos, con el mismo orden, la misma paginación y los mismos filtros que antes del
cambio. Lo único que cambia es cuántas sentencias SQL cuesta producirlos.

En particular, MUST preservarse intactas las garantías de acceso: la redirección a `/login` de los
visitantes anónimos que solicitan rutas protegidas, la redirección a `/mi-panel` de los usuarios
autenticados sin rol de administración, y el aislamiento de los datos de cada socio.

#### Scenario: Equivalencia de contenido en el portal del socio

- **GIVEN** cualquier página de `/mi-panel` antes del cambio
- **WHEN** se la vuelve a cargar después del cambio, con los mismos datos en la base
- **THEN** muestra exactamente la misma información, con el mismo orden y la misma paginación

#### Scenario: Equivalencia de contenido en el backoffice

- **GIVEN** cualquier página de `/admin` antes del cambio
- **WHEN** se la vuelve a cargar después del cambio, con los mismos datos en la base
- **THEN** muestra exactamente la misma información, y una modificación hecha desde el admin se
  refleja de inmediato al recargar

#### Scenario: Control de acceso preservado

- **GIVEN** un visitante anónimo, y un usuario autenticado sin rol de administración
- **WHEN** el anónimo solicita `/admin` o `/mi-panel`, y el autenticado sin rol solicita `/admin`
- **THEN** el anónimo es redirigido a `/login` y el autenticado sin rol es redirigido a `/mi-panel`,
  igual que antes del cambio

#### Scenario: Relaciones vacías o ausentes

- **GIVEN** un registro cuyas relaciones asociadas están vacías —por ejemplo un profesional sin
  localidad asignada o sin ninguna especialidad—
- **WHEN** se lo lee con la nueva estrategia de carga de relaciones
- **THEN** se obtiene el mismo resultado que antes: el registro aparece, con sus relaciones vacías o
  nulas, y no queda excluido del listado
