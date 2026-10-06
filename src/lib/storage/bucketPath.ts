/** Extrae el path relativo al bucket de una URL pública. `null` si no matchea. */
export function extraerPathDelBucket(url: string, bucket: string): string | null {
  try {
    const marcador = `/${bucket}/`;
    const parsed = new URL(url);
    const idx = parsed.pathname.indexOf(marcador);
    if (idx === -1) return null;
    const path = parsed.pathname.slice(idx + marcador.length);
    return path || null;
  } catch {
    return null;
  }
}
