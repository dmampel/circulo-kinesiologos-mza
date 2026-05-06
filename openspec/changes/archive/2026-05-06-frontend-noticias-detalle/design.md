# Design: frontend-noticias-detalle

## Technical Approach

Implementar un Server Component en la ruta dinámica `/noticias/[slug]/page.tsx` para hacer fetch de los datos directamente en el servidor. Utilizaremos `react-markdown` en conjunto con el plugin `@tailwindcss/typography` para transformar el contenido Markdown a HTML estilizado de manera segura, aplicando principios de Atomic Design para la UI.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| **Renderizado Markdown** | `react-markdown` + `@tailwindcss/typography` | `marked` o `showdown` con `dangerouslySetInnerHTML` | Es seguro contra XSS (XSS-safe by default), basado en componentes React, y se estiliza automáticamente con la clase `.prose` de Tailwind. |
| **Data Fetching** | Server Components | Client Components con Fetch API | Mejora el SEO nativo (clave para noticias), reduce el JS enviado al cliente, y permite llamadas directas a la base de datos sin APIs intermedias. |
| **Manejo de Errores (404)** | `notFound()` de Next.js | Redirección 302 o página de error genérica | Evita penalizaciones SEO al devolver un HTTP status 404 real cuando el slug no existe en la DB. |

## Data Flow

    [Browser Request: /noticias/mi-novedad]
         │
    [Next.js Server Component]
         │
    [NoticiaRepository.getBySlug("mi-novedad")]
         │
    [Prisma ORM] ──→ [Supabase PostgreSQL DB]
         │
    (Retorna Objeto Noticia)
         │
    [React Component ──→ react-markdown (Parser)]
         │
    [HTML Estático con clases de Tailwind Typography entregado al Browser]

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/repositories/NoticiaRepository.ts` | Modify | Agregar el método `getBySlug(slug: string)`. |
| `src/app/noticias/[slug]/page.tsx` | Create | Server Component principal. Maneja metadata SEO, data fetching y renderizado del Markdown. |
| `package.json` | Modify | Instalar dependencias: `react-markdown` y `@tailwindcss/typography`. |
| `globals.css` / `eslint.config.mjs` | Modify | Añadir el plugin typography a la configuración de Tailwind v4 si es necesario. |

## UI Component Breakdown (Atomic Design)

- **Pages**: 
  - `NoticiaDetailPage`: Layout principal. Contiene el Header de la noticia (Imagen de portada si existe, Título, Fecha de publicación) y el cuerpo del texto.
- **Atoms**:
  - `BackButton`: Botón genérico de retroceso ("Volver a noticias") usando Lucide icons.
- **Molecules**:
  - `ShareButtons`: Botonera simple de compartir (Nativo del navegador o enlaces web).

## Interfaces / Contracts

```typescript
// Extensión requerida en NoticiaRepository
static async getBySlug(slug: string) {
  return prisma.noticia.findUnique({
    where: { slug }
  });
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (Prisma) | `getBySlug` Query | Verificación manual de que la consulta devuelve los datos esperados y maneja el caso `null`. |
| Integration | Metadata Generation | Validar en el browser que el tag `<title>` y `<meta name="description">` se populen dinámicamente según la nota. |
| UI/E2E | Markdown Styling | Abrir una nota de prueba y revisar que elementos como `<h2>`, `<strong>` y `<ul>` tomen los estilos de `.prose`. |

## Migration / Rollout

No migration required. El esquema de Prisma ya contempla el campo `contenido` como `String` (Markdown).

## Open Questions

- None
