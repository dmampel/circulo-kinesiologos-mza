import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET_SOLICITUDES = "solicitudes";

/**
 * Vigencia de las URLs firmadas de documentos de solicitudes (1 hora).
 * Suficiente para que un admin revise la documentación de una solicitud sin
 * que el enlace quede utilizable si se filtra.
 */
export const SIGNED_URL_TTL_SEGUNDOS = 60 * 60;

/**
 * Firma los documentos de una solicitud para que sólo el admin logueado pueda
 * verlos. El bucket `solicitudes` es privado: contiene DNI, títulos, seguros y
 * CV de los solicitantes, así que nunca debe servirse por URL pública.
 *
 * Nunca lanza: si Storage falla o un objeto no existe, ese documento queda
 * fuera del mapa y la página lo muestra como no disponible en lugar de romper
 * la revisión completa de la solicitud.
 */
export async function firmarUrlsDocumentos(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_SOLICITUDES)
      .createSignedUrls(paths, SIGNED_URL_TTL_SEGUNDOS);

    if (error || !data) return {};

    const urls: Record<string, string> = {};
    for (const item of data) {
      if (item.signedUrl && !item.error) {
        urls[item.path ?? ""] = item.signedUrl;
      }
    }
    return urls;
  } catch {
    return {};
  }
}
