import { firmarUrls } from "./firmar";

/** Bucket privado de CVs de la bolsa de trabajo (`design.md — D4`). */
export const BUCKET_BOLSA_TRABAJO_CV = "bolsa-trabajo-cv";

/** Vigencia de la URL firmada del CV: la misma vigencia de panel que `solicitudes` (1 hora). */
export const SIGNED_URL_TTL_CV_SEGUNDOS = 60 * 60;

/**
 * Firma la URL del CV de un aviso `AvisoBuscoTrabajo`. Nunca lanza: si
 * Storage falla, el CV se reporta como no disponible y el resto del
 * contacto igual se revela (`design.md — D4`).
 */
export async function firmarCv(path: string): Promise<string | null> {
  const urls = await firmarUrls(BUCKET_BOLSA_TRABAJO_CV, [path], SIGNED_URL_TTL_CV_SEGUNDOS);
  return urls[path] ?? null;
}
