# Tasks: frontend-noticias-detalle

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: DB/Prisma & Dependencias (Foundation)

- [x] 1.1 Instalar dependencias en `ckm-web`: `npm install react-markdown` y `npm install -D @tailwindcss/typography`.
- [x] 1.2 Agregar `@tailwindcss/typography` al archivo principal de estilos de Tailwind v4 (`globals.css` o `postcss.config.mjs`).
- [x] 1.3 Modificar `src/lib/repositories/NoticiaRepository.ts` para agregar `static async getBySlug(slug: string)`.

## Phase 2: Backend (Data Fetching & SEO)

- [x] 2.1 Crear el archivo `src/app/noticias/[slug]/page.tsx`.
- [x] 2.2 Implementar la función `generateMetadata` en la nueva página para extraer `titulo` y `resumen`.
- [x] 2.3 Implementar lógica Server Component para obtener la noticia llamando a `NoticiaRepository.getBySlug()`.
- [x] 2.4 Validar si la noticia no existe y ejecutar `notFound()`.

## Phase 3: Frontend (UI & Render)

- [x] 3.1 Construir el layout visual del Hero de la noticia (título, fecha, imagen).
- [x] 3.2 Implementar botón "Volver a noticias" en el encabezado.
- [x] 3.3 Integrar el componente `<ReactMarkdown>` usando la clase `prose` para renderizar el campo `contenido`.

## Phase 4: Testing & Cleanup

- [x] 4.1 Validar manualmente navegando a `/noticias/[slug-existente]`.
- [x] 4.2 Validar manualmente un slug inexistente para asegurar el trigger del 404.
- [x] 4.3 Inspeccionar `<head>` en el browser para confirmar metatags dinámicos.
