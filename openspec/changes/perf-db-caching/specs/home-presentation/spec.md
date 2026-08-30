## MODIFIED Requirements

### Requirement: Home muestra últimas noticias
La página MUST mostrar las últimas 3 noticias con `publicada = true`, ordenadas por fecha descendente.

La selección de esas 3 noticias MUST resolverse en la consulta a la base de datos —filtrando por
`publicada = true`, ordenando por fecha descendente y limitando la cantidad— y no filtrando en
memoria sobre la tabla completa. El resultado visible MUST ser equivalente al comportamiento previo.

#### Scenario: Hay noticias publicadas
- **WHEN** existen noticias con `publicada = true`
- **THEN** se muestran hasta 3 con título, resumen y fecha de publicación

#### Scenario: No hay noticias publicadas
- **WHEN** no existen noticias con `publicada = true`
- **THEN** la sección de noticias no se renderiza

#### Scenario: Las noticias más recientes están sin publicar
- **GIVEN** que las noticias más recientes por fecha tienen `publicada = false` y existen noticias
  publicadas más antiguas
- **WHEN** el visitante accede al home
- **THEN** se muestran las 3 noticias publicadas más recientes, sin huecos ni secciones vacías

### Requirement: Home muestra beneficios KineClub
La página MUST mostrar hasta 3 beneficios KineClub con `activa = true`, junto con el total de beneficios activos.

La selección de esos beneficios MUST resolverse en la consulta a la base de datos —filtrando por
`activa = true` y limitando la cantidad— y no filtrando en memoria sobre la tabla completa.
El resultado visible MUST ser equivalente al comportamiento previo.

#### Scenario: Hay beneficios activos
- **WHEN** existen beneficios con `activa = true`
- **THEN** se muestran hasta 3 con empresa, descripción, categoría y descuento (si aplica)

#### Scenario: No hay beneficios activos
- **WHEN** no existen beneficios con `activa = true`
- **THEN** la sección KineClub no se renderiza

#### Scenario: Los beneficios más recientes están inactivos
- **GIVEN** que los beneficios más recientes tienen `activa = false` y existen beneficios activos más antiguos
- **WHEN** el visitante accede al home
- **THEN** se muestran hasta 3 beneficios activos, sin huecos ni secciones vacías

## ADDED Requirements

### Requirement: El contenido del home admite una ventana de staleness acotada
El home MUST servirse desde cache con revalidación temporal. En consecuencia, el contenido mostrado
MAY reflejar el estado de la base con un retraso máximo igual a la ventana de revalidación configurada.

Esta ventana MUST estar documentada y MUST ser acotada, de modo que una publicación hecha desde el
panel de administración se vuelva visible en el home sin intervención manual.

#### Scenario: Publicación de una noticia se refleja tras la revalidación
- **GIVEN** que una administradora publica una noticia nueva desde `/admin`
- **WHEN** transcurre la ventana de revalidación y un visitante accede al home
- **THEN** la noticia aparece en el home sin necesidad de un redeploy ni de purgar el cache manualmente

#### Scenario: Contenido servido desde cache es idéntico para todos los visitantes
- **GIVEN** el home cacheado en el edge
- **WHEN** dos visitantes anónimos distintos lo solicitan dentro de la misma ventana
- **THEN** ambos reciben exactamente el mismo contenido, sin datos derivados de ninguna sesión
