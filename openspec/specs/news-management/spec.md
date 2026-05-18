## Requirements

### Requirement: Dynamic Category Fetching
El sistema debe obtener las categorías de noticias desde la base de datos en lugar de usar valores estáticos.

#### Scenario: Display categories in filter bar
- **WHEN** El usuario accede a la página de noticias
- **THEN** La barra de filtros debe mostrar las categorías activas obtenidas de la DB (Institucional, Eventos, etc.)

### Requirement: Category Filtering
El lector de noticias debe permitir filtrar el listado lateral basado en la categoría seleccionada.

#### Scenario: Filter news by category
- **WHEN** El usuario hace clic en una categoría (ej: "Capacitación")
- **THEN** El sidebar de noticias debe mostrar solo aquellas que pertenecen a dicha categoría
- **AND** Si no hay noticias, debe mostrar un mensaje indicando que no hay resultados para ese filtro

### Requirement: Data Integrity
Cada noticia debe poder estar vinculada opcionalmente a una categoría existente.

#### Scenario: News without category
- **WHEN** Una noticia no tiene `categoriaId` asignado
- **THEN** Debe mostrarse bajo la categoría general o "Todas", pero sin una etiqueta específica de categoría en su detalle
