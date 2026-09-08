# Delta for noticias-frontend

## ADDED Requirements

### Requirement: Carrusel de portada en el detalle de noticia

La página `/noticias/[slug]` DEBE renderizar las imágenes de portada de la noticia como un
carrusel cuando hay más de una, conservando el comportamiento actual cuando hay una o ninguna.

El carrusel DEBE ser un componente cliente (`"use client"`) montado dentro de la página, que
sigue siendo un Server Component y hace el fetch de datos.

#### Scenario: Noticia con dos o más imágenes

- GIVEN una noticia con N ≥ 2 filas en `NoticiaImagen`
- WHEN un usuario abre `/noticias/[slug]`
- THEN el sistema DEBE mostrar la imagen de `orden = 0` como slide inicial
- AND DEBE ofrecer controles de anterior/siguiente e indicadores de posición
- AND DEBE indicar la posición actual (por ejemplo "2 / 5")
- AND la transición entre slides DEBE ser animada con `framer-motion`.

#### Scenario: Noticia con una sola imagen

- GIVEN una noticia con exactamente una imagen
- WHEN se renderiza el detalle
- THEN el sistema DEBE mostrar la imagen estática, sin flechas ni indicadores
- AND el resultado visual DEBE ser equivalente al comportamiento previo al cambio.

#### Scenario: Noticia sin imágenes

- GIVEN una noticia sin ninguna imagen
- WHEN se renderiza el detalle
- THEN el sistema DEBE mostrar el placeholder actual (bloque `aspect-video` con el ícono `Newspaper`).

#### Scenario: Navegación por teclado y gesto

- GIVEN un carrusel con foco en el navegador
- WHEN el usuario presiona las flechas izquierda/derecha
- THEN el carrusel DEBE avanzar o retroceder un slide
- AND en pantallas táctiles el swipe horizontal DEBE producir el mismo efecto
- AND los controles DEBEN tener `aria-label` descriptivo.

#### Scenario: Sin autoplay

- GIVEN un carrusel con varias imágenes
- WHEN la página termina de cargar
- THEN el carrusel NO DEBE avanzar solo
- AND el cambio de slide DEBE ser siempre iniciado por el usuario.

#### Scenario: Rendimiento de carga

- GIVEN un carrusel con N imágenes
- WHEN la página se renderiza
- THEN solo la imagen de `orden = 0` DEBE marcarse con `priority`
- AND las restantes DEBEN cargarse de forma diferida.

#### Scenario: Texto alternativo del slide

- GIVEN una imagen del carrusel
- WHEN se renderiza
- THEN el `alt` DEBE ser el `alt` guardado de la imagen
- AND si está vacío o nulo, DEBE caer al `titulo` de la noticia.

#### Scenario: Estilo del carrusel

- GIVEN el carrusel renderizado
- WHEN se inspecciona su estilo
- THEN los controles DEBEN usar glassmorphism (`backdrop-blur`) sobre la imagen
- AND NO DEBEN usarse píxeles fijos para tamaños ni espaciados (escalas de Tailwind / `rem`)
- AND el contenedor DEBE mantener la relación `aspect-video` responsiva actual.

## MODIFIED Requirements

### Requirement: Visualización de Noticia

The system MUST fetch and render the content of a news article based on its slug parameter.

#### Scenario: Noticia encontrada y publicada

- GIVEN a user navigates to the URL `/noticias/[slug]`
- AND the `slug` exists in the database
- WHEN the page loads
- THEN the system MUST fetch the article using `NoticiaRepository.getBySlug`, incluyendo `imagenes` ordenadas por `orden`
- AND the system MUST render the article's `titulo` y `publicada_en`
- AND the system MUST render la portada mediante el carrusel de imágenes
- AND the system MUST render the parsed Markdown `contenido`.

#### Scenario: Noticia no encontrada

- GIVEN a user navigates to the URL `/noticias/[slug]`
- AND the `slug` does NOT exist in the database
- WHEN the page loads
- THEN the system MUST return a 404 Not Found response
- AND invoke the Next.js `notFound()` function.

### Requirement: SEO Metadata

The system MUST dynamically generate the `<title>` and `<meta name="description">` tags for the
page based on the article's specific data.

#### Scenario: Generación dinámica de head tags

- GIVEN a user or crawler accesses `/noticias/[slug]`
- WHEN the Next.js `generateMetadata` function executes
- THEN el `<title>` MUST be set to the article's `titulo` appended with the site name
- AND el `<meta name="description">` MUST be set to the article's `resumen` or a truncated version of the content
- AND la imagen de Open Graph MUST seguir tomándose de `imagen_url` (derivado de la primera imagen), sin listar el resto de la galería.

### Requirement: Sidebar de noticias relacionadas

El detalle de una noticia muestra un sidebar con noticias relacionadas en tarjetas compactas.

#### Scenario: Sidebar de noticias relacionadas

- GIVEN el detalle de una noticia
- WHEN se renderiza el sidebar de relacionadas
- THEN cada card MUST seguir usando `imagen_url` de la noticia relacionada
- AND NO MUST cargarse la galería completa de las relacionadas.
