# Design: seo-and-redirects

## Archivos nuevos

### `src/app/sitemap.ts`
```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap>
```
- Estáticas: `/`, `/institucional`, `/kineclub`, `/obras-sociales`, `/noticias`, `/profesionales`
- Dinámicas: todos los `profesional.slug` activos + todos los `noticia.slug` publicadas
- Usa `NEXT_PUBLIC_SITE_URL` como base

### `src/app/robots.ts`
```ts
export default function robots(): MetadataRoute.Robots
```
- Allow: `*`
- Sitemap: `${SITE_URL}/sitemap.xml`

## Páginas modificadas — OG metadata

| Página | Tipo | Qué agregar |
|--------|------|-------------|
| `/profesionales` | `export const metadata` | Título + description + OG básico |
| `/profesionales/[slug]` | `generateMetadata` async | Nombre, especialidad, foto |
| `/institucional` | `export const metadata` | Título + description institucional |
| `/kineclub` | `export const metadata` | Título + description KineClub |
| `/obras-sociales` | `export const metadata` | Título + description obras sociales |

## Redirects WP — `next.config.ts`
Pendiente de exportar URLs del panel WordPress. Se agrega `async redirects()` con array de `{ source, destination, permanent: true }`.

## Datos que usa el sitemap
- `ProfesionalRepository.findAll()` — filtrar activos (`status: "Activo"`)
- `NoticiaRepository.findAll()` — filtrar publicadas
