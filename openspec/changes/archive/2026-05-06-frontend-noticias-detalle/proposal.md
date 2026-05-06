# Proposal: Frontend Noticias Detalle

## Intent
Permitir a los usuarios leer el contenido completo de las noticias publicadas por el Círculo. Actualmente solo existe el listado, y el contenido en DB está en formato Markdown sin un renderizador implementado en el frontend.

## Scope

### In Scope
- Creación de ruta dinámica `/noticias/[slug]`.
- Fetch de la noticia desde Prisma usando `NoticiaRepository`.
- Instalación de dependencias para parseo de Markdown.
- Renderizado de Markdown usando `react-markdown` y Tailwind Typography.

### Out of Scope
- Comentarios en las noticias.
- Integración con redes sociales nativas (solo botones de compartir genéricos).

## Capabilities

### New Capabilities
- `noticias-frontend`: Capacidad para visualizar el detalle completo de noticias institucionales parseando contenido Markdown y gestionando metadatos dinámicos.

### Modified Capabilities
- Ninguna.

## Approach
Se extenderá `NoticiaRepository` con `getBySlug(slug)`. Se creará el Server Component en `src/app/noticias/[slug]/page.tsx` para hacer fetch de los datos y SEO metadata dinámica. Se instalará `react-markdown` y `@tailwindcss/typography` para renderizar el contenido de forma segura con la clase `.prose` de Tailwind.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/repositories/NoticiaRepository.ts` | Modified | Agregar método `getBySlug` |
| `src/app/noticias/[slug]/page.tsx` | New | Página de detalle de la noticia |
| `package.json` | Modified | Nuevas dependencias de markdown |
| Prisma Schema | None | El esquema ya soporta Markdown |
| Supabase Auth/DB | None | No requiere migraciones |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Hydration errors por HTML inválido en Markdown | Low | Usar `react-markdown` que sanitiza y parsea correctamente el contenido sin `dangerouslySetInnerHTML`. |
| Tailwind v4 compatibilidad con Typography | Low | Configurar vía import en `globals.css` o `eslint.config.mjs` según la doc de Tailwind 4. |

## Rollback Plan
Revertir el commit que introduce la página y desinstalar las dependencias de markdown en `package.json`.

## Dependencies
- `react-markdown`
- `@tailwindcss/typography`

## Success Criteria
- [ ] La URL `/noticias/[slug]` carga correctamente los datos de la DB.
- [ ] El texto en Markdown se renderiza como HTML estilizado (títulos, listas, negritas).
- [ ] Título y descripción en los metatags `<head>` se generan dinámicamente.
