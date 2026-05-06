## Exploration: frontend-noticias-detalle

### Current State
- Model `Noticia` in Prisma stores `contenido` as Markdown text.
- `NoticiaRepository` exists but only has `getLatest()` and `getById()`. It lacks `getBySlug()`.
- `src/app/noticias/page.tsx` renders a list of news and links to `/noticias/[slug]`.
- The detail page `/noticias/[slug]/page.tsx` does not exist yet.
- There is no markdown rendering library installed in `package.json`.

### Affected Areas
- `src/lib/repositories/NoticiaRepository.ts` — Needs a new method to fetch a news article by its slug.
- `src/app/noticias/[slug]/page.tsx` — The new dynamic page to render the article.
- `package.json` — Needs markdown parsing capabilities.

### Approaches
1. **Install `react-markdown` + `@tailwindcss/typography`**
   - Pros: Standard, safe (no dangerouslySetInnerHTML), integrates perfectly with Tailwind via the `prose` class.
   - Cons: Requires installing two new dependencies.
   - Effort: Low

2. **Custom lightweight parser (marked)**
   - Pros: Very fast.
   - Cons: Requires dangerouslySetInnerHTML, which is a security risk if content is not sanitized. Harder to style without typography plugin.
   - Effort: Medium

### Recommendation
Option 1 (**`react-markdown` + `@tailwindcss/typography`**). It is the standard for Next.js App Router and Tailwind, providing a safe and beautifully styled reading experience right out of the box using the `.prose` class.

### Risks
- Next.js hydration issues if the markdown contains invalid nested HTML.
- Missing `tailwindcss-typography` plugin in `tailwind.config.ts` (Tailwind 4 uses `@tailwindcss/postcss` and simple imports, so we need to ensure the typography plugin works with v4).

### Ready for Proposal
Yes. We have a clear understanding of the data model and the missing pieces.
