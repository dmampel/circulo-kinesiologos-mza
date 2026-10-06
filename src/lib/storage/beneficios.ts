import { supabaseAdmin } from "@/lib/supabase/admin";
import { extraerPathDelBucket } from "./bucketPath";

export const BUCKET_BENEFICIOS_LOGOS = "beneficios-logos";

type CambioLogoInput = {
  actual: string | null;
  subida: string | null;
  urlPegada: string | null;
  quitar: boolean;
};

/** Decide el `logo_url` final y qué URL vieja hay que borrar. Pura. */
export function resolverCambioLogo({ actual, subida, urlPegada, quitar }: CambioLogoInput): {
  logo_url: string | null;
  aBorrar: string | null;
} {
  if (subida) return { logo_url: subida, aBorrar: actual };
  if (quitar) return { logo_url: null, aBorrar: actual };
  if (urlPegada && urlPegada !== actual) return { logo_url: urlPegada, aBorrar: actual };
  return { logo_url: actual, aBorrar: null };
}

/** Sube el logo al bucket y devuelve su URL pública. Lanza si falla. */
export async function subirLogoBeneficio(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_BENEFICIOS_LOGOS)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) throw new Error("No se pudo subir el logo.");

  return supabaseAdmin.storage.from(BUCKET_BENEFICIOS_LOGOS).getPublicUrl(path).data.publicUrl;
}

/** Borra el logo del bucket. Ignora URLs externas y traga errores (best-effort). */
export async function borrarLogoDeStorage(url: string | null): Promise<void> {
  if (!url) return;
  const path = extraerPathDelBucket(url, BUCKET_BENEFICIOS_LOGOS);
  if (!path) return;
  try {
    await supabaseAdmin.storage.from(BUCKET_BENEFICIOS_LOGOS).remove([path]);
  } catch {
    // Best-effort: no debe abortar el guardado del beneficio.
  }
}
