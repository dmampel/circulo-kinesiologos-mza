import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET_NOTICIAS_IMAGENES = "noticias-imagenes";
const MARCADOR = `/${BUCKET_NOTICIAS_IMAGENES}/`;

/**
 * Borra del bucket `noticias-imagenes` las imágenes cuya URL pertenece al
 * bucket propio (mismo patrón que `deleteStorageFile` de
 * `src/app/admin/circulares/actions.ts`). Las URLs externas (Unsplash, etc.)
 * se ignoran sin tocar Storage. Best-effort: una falla acá NO debe abortar
 * el guardado de la noticia.
 */
export async function borrarImagenesDeStorage(urls: string[]): Promise<void> {
  const paths = urls
    .filter((url) => url.includes(BUCKET_NOTICIAS_IMAGENES))
    .map((url) => extraerPathDelBucket(url))
    .filter((path): path is string => !!path);

  if (paths.length === 0) return;

  try {
    await supabaseAdmin.storage.from(BUCKET_NOTICIAS_IMAGENES).remove(paths);
  } catch {
    // Best-effort: se traga el error, no debe abortar el guardado de la noticia.
  }
}

/** Extrae el path relativo al bucket de una URL pública. `null` si no matchea. */
export function extraerPathDelBucket(url: string): string | null {
  try {
    const parsed = new URL(url);
    const idx = parsed.pathname.indexOf(MARCADOR);
    if (idx === -1) return null;
    const path = parsed.pathname.slice(idx + MARCADOR.length);
    return path || null;
  } catch {
    return null;
  }
}
