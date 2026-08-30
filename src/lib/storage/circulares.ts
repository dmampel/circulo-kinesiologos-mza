import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET_CIRCULARES = "circulares-adjuntos";
const MARCADOR = `/${BUCKET_CIRCULARES}/`;

/** Vigencia de las URLs firmadas de adjuntos de circulares (1 hora). */
export const SIGNED_URL_TTL_SEGUNDOS = 60 * 60;

/**
 * Resuelve el `archivo_url` de una circular en una URL servible.
 *
 * El campo admite dos formas, porque el form del admin permite tanto subir un
 * archivo como pegar un enlace externo a mano:
 * - Adjunto propio (bucket `circulares-adjuntos`, privado) → se firma con el
 *   service role y expira en 1 hora.
 * - Enlace externo (Drive, un PDF de otro sitio) → se devuelve sin tocar.
 *
 * Nunca lanza. Si la firma falla devuelve `null` en lugar de caer de vuelta a
 * la URL pública: el bucket es privado y esa URL ya no resuelve.
 */
export async function firmarUrlCircular(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;

  const idx = url.indexOf(MARCADOR);
  if (idx === -1) return url;

  const path = url.slice(idx + MARCADOR.length).split("?")[0];
  if (!path) return null;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_CIRCULARES)
      .createSignedUrl(path, SIGNED_URL_TTL_SEGUNDOS);

    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
