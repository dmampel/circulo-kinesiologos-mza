import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Firmador genérico de URLs de Storage. Extraído de `solicitudes.ts`
 * (`openspec/changes/bolsa-de-trabajo/tasks.md — 3.1`) para que cualquier
 * bucket privado del proyecto (hoy `solicitudes`, ahora también
 * `bolsa-trabajo-cv`) pueda firmar objetos sin duplicar esta lógica.
 *
 * Nunca lanza: si Storage falla o un objeto no existe, ese path queda fuera
 * del mapa devuelto y el llamador lo muestra como no disponible en lugar de
 * romper la operación completa.
 */
export async function firmarUrls(
  bucket: string,
  paths: string[],
  ttlSegundos: number,
): Promise<Record<string, string>> {
  if (!paths.length) return {};

  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrls(paths, ttlSegundos);

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
