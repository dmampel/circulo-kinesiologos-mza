# Noticias Frontend Specification

## Purpose

Define el comportamiento público de la página de detalle de noticias, incluyendo el fetch de datos por slug, el parseo seguro de contenido Markdown, y la generación de metadatos SEO dinámicos.

## Requirements

### Requirement: Visualización de Noticia

The system MUST fetch and render the content of a news article based on its slug parameter.

#### Scenario: Noticia encontrada y publicada

- GIVEN a user navigates to the URL `/noticias/[slug]`
- AND the `slug` exists in the database
- WHEN the page loads
- THEN the system MUST fetch the article using `NoticiaRepository.getBySlug`
- AND the system MUST render the article's `titulo`, `publicada_en`, and `imagen_url`
- AND the system MUST render the parsed Markdown `contenido`.

#### Scenario: Noticia no encontrada

- GIVEN a user navigates to the URL `/noticias/[slug]`
- AND the `slug` does NOT exist in the database
- WHEN the page loads
- THEN the system MUST return a 404 Not Found response
- AND invoke the Next.js `notFound()` function.

### Requirement: Renderizado de Markdown

The system MUST safely convert Markdown text into HTML, applying consistent styling, without exposing the client to Cross-Site Scripting (XSS) vulnerabilities.

#### Scenario: Contenido con formato Markdown

- GIVEN a news article contains Markdown formatting (headers, bold text, lists, links)
- WHEN the article is rendered in the UI
- THEN the system MUST display the appropriate HTML elements 
- AND the system MUST apply Tailwind typography styling via the `prose` class
- AND the system MUST NOT use `dangerouslySetInnerHTML`.

### Requirement: NoticiaRepository.update

The system MUST expose an `update(id, data)` method on `NoticiaRepository` that persists changes to an existing noticia.

#### Scenario: Actualización exitosa

- GIVEN a valid noticia `id` and a partial data object
- WHEN `NoticiaRepository.update(id, data)` is called
- THEN the system MUST call `prisma.noticia.update({ where: { id }, data })`
- AND MUST return the updated record.

### Requirement: SEO Metadata

The system MUST dynamically generate the `<title>` and `<meta name="description">` tags for the page based on the article's specific data.

#### Scenario: Generación dinámica de head tags

- GIVEN a user or crawler accesses `/noticias/[slug]`
- WHEN the Next.js `generateMetadata` function executes
- THEN the `<title>` MUST be set to the article's `titulo` appended with the site name
- AND the `<meta name="description">` MUST be set to the article's `resumen` or a truncated version of the content.
