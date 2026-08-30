/**
 * Dominio público del sitio. Única fuente de verdad para canonicals, OpenGraph,
 * sitemap y robots: antes cada página hardcodeaba su URL, lo que dejaba los
 * canonical apuntando a un dominio equivocado cuando cambiaba el real.
 *
 * En producción se configura con `NEXT_PUBLIC_SITE_URL` en Vercel.
 */
const DOMINIO_POR_DEFECTO = "https://www.kinesiologosmza.com.ar";

/** Normaliza la base: recorta espacios y barras finales, o cae al dominio real. */
export function normalizarBaseUrl(valor: string | undefined): string {
  const limpio = valor?.trim().replace(/\/+$/, "");
  return limpio || DOMINIO_POR_DEFECTO;
}

/** Une la base con una ruta garantizando una sola barra. */
export function construirUrlAbsoluta(path: string, base: string = SITE_URL): string {
  const ruta = path.replace(/^\/+/, "");
  return ruta ? `${base}/${ruta}` : base;
}

export const SITE_URL = normalizarBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
