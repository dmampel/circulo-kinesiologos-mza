import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET_SOLICITUDES = "solicitudes";

/**
 * Vigencia de las URLs firmadas de documentos de solicitudes (1 hora).
 * Suficiente para que un admin revise la documentación de una solicitud sin
 * que el enlace quede utilizable si se filtra.
 */
export const SIGNED_URL_TTL_SEGUNDOS = 60 * 60;

/**
 * Vigencia de las URLs firmadas cuando viajan por mail (7 días).
 * La vigencia de panel (1 hora) es correcta para un admin que firma por
 * request mientras mira la pantalla; un enlace que viaja por mail se abre
 * cuando administración abre el mail, que puede ser al otro día o el lunes
 * siguiente. Una hora garantiza que el mail llegue ya roto.
 */
export const SIGNED_URL_TTL_EMAIL_SEGUNDOS = 60 * 60 * 24 * 7;

/**
 * Firma los documentos de una solicitud para que sólo quien tenga el enlace
 * pueda verlos durante la vigencia elegida. El bucket `solicitudes` es
 * privado: contiene DNI, títulos, seguros y CV de los solicitantes, así que
 * nunca debe servirse por URL pública.
 *
 * Nunca lanza: si Storage falla o un objeto no existe, ese documento queda
 * fuera del mapa y el llamador lo muestra como no disponible en lugar de
 * romper la revisión completa de la solicitud.
 */
export async function firmarUrlsDocumentos(
  paths: string[],
  ttlSegundos: number = SIGNED_URL_TTL_SEGUNDOS,
): Promise<Record<string, string>> {
  if (!paths.length) return {};

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_SOLICITUDES)
      .createSignedUrls(paths, ttlSegundos);

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
