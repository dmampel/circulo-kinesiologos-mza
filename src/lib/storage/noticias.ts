import { supabaseAdmin } from "@/lib/supabase/admin";
import { extraerPathDelBucket } from "./bucketPath";

const BUCKET_NOTICIAS_IMAGENES = "noticias-imagenes";

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
    .map((url) => extraerPathDelBucket(url, BUCKET_NOTICIAS_IMAGENES))
    .filter((path): path is string => !!path);

  if (paths.length === 0) return;

  try {
    await supabaseAdmin.storage.from(BUCKET_NOTICIAS_IMAGENES).remove(paths);
  } catch {
    // Best-effort: se traga el error, no debe abortar el guardado de la noticia.
  }
}
