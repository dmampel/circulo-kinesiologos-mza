# Proposal: seo-and-redirects

## Problema
El sitio no tiene sitemap, robots.txt, ni metadatos OG completos en las páginas públicas. Esto afecta el posicionamiento en Google y la previsualización en redes sociales.

## Solución

1. **`sitemap.ts`** dinámico — incluye páginas estáticas + profesionales + noticias publicadas
2. **`robots.ts`** — permite todo, referencia el sitemap
3. **OG metadata** en todas las páginas públicas que faltan:
   - `/profesionales` (lista)
   - `/profesionales/[slug]` (detalle — `generateMetadata` dinámico)
   - `/institucional`
   - `/kineclub`
   - `/obras-sociales`
4. **Redirects 301** desde el viejo WordPress en `next.config.ts` — pendiente de obtener URLs del panel WP

## Estado al iniciar
- `noticias/[slug]`: `generateMetadata` con OG ✅ (ya hecho)
- Todo lo demás: falta

## Dominio
`https://www.circulokinesiologos.com.ar` (de `NEXT_PUBLIC_SITE_URL`)
