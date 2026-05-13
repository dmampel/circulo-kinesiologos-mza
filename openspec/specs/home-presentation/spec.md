## ADDED Requirements

### Requirement: Home muestra stats reales
La página de inicio MUST mostrar conteos reales obtenidos de la base de datos: total de profesionales activos, total de obras sociales activas, y total de beneficios KineClub activos.

#### Scenario: Stats reflejan la DB
- **WHEN** el visitante accede al home
- **THEN** los números mostrados coinciden con los registros activos en la base de datos

### Requirement: Home muestra últimas noticias
La página MUST mostrar las últimas 3 noticias con `publicada = true`, ordenadas por fecha descendente.

#### Scenario: Hay noticias publicadas
- **WHEN** existen noticias con `publicada = true`
- **THEN** se muestran hasta 3 con título, resumen y fecha de publicación

#### Scenario: No hay noticias publicadas
- **WHEN** no existen noticias con `publicada = true`
- **THEN** la sección de noticias no se renderiza

### Requirement: Home muestra próximas capacitaciones
La página MUST mostrar hasta 3 capacitaciones con `publicada = true` y `fechaInicio` mayor o igual a la fecha actual.

#### Scenario: Hay capacitaciones próximas
- **WHEN** existen capacitaciones futuras publicadas
- **THEN** se muestran hasta 3 con tipo, título, fecha, modalidad y ubicación (si aplica)

#### Scenario: No hay capacitaciones próximas
- **WHEN** no existen capacitaciones futuras publicadas
- **THEN** la sección de capacitaciones no se renderiza

### Requirement: Home muestra beneficios KineClub
La página MUST mostrar hasta 3 beneficios KineClub con `activa = true`, junto con el total de beneficios activos.

#### Scenario: Hay beneficios activos
- **WHEN** existen beneficios con `activa = true`
- **THEN** se muestran hasta 3 con empresa, descripción, categoría y descuento (si aplica)

#### Scenario: No hay beneficios activos
- **WHEN** no existen beneficios con `activa = true`
- **THEN** la sección KineClub no se renderiza

### Requirement: Home presenta el Círculo de forma visual e institucional
El home público SHALL presentar la institución con animaciones de scroll que den dinamismo a la experiencia. Las secciones MUST aparecer progresivamente al hacer scroll, usando `ScrollReveal` como wrapper. Las grillas de cards MUST usar stagger para sus ítems.

### Requirement: Home es Server Component
La página de inicio MUST ser un React Server Component que realiza todos los fetches en el servidor.

#### Scenario: Render sin JS cliente
- **WHEN** el visitante accede al home con JS deshabilitado
- **THEN** todo el contenido (stats, noticias, capacitaciones, beneficios) es visible
