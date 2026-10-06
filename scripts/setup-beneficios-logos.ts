/**
 * Setup del bucket de logos de beneficios KineClub
 * (`openspec/changes/subida-logo-beneficios`, tarea 2.1).
 *
 * Crea el bucket PÚBLICO `beneficios-logos` (2 MB, PNG/JPEG/WEBP/AVIF) y verifica
 * subiendo un PNG de prueba, pidiendo su URL pública (debe dar 200) y borrándolo.
 * No hay tablas nuevas, así que no hay RLS ni políticas de Storage: la escritura
 * es con service role y la lectura es pública por el flag del bucket.
 *
 * Es idempotente: si el bucket ya existe, lo reporta y sigue con la verificación.
 *
 * Uso (lo corre una persona, nunca un agente): npx tsx scripts/setup-beneficios-logos.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = "beneficios-logos";

// PNG 1x1 transparente.
const PNG_PRUEBA = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

async function main() {
  const { data: existentes, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) throw new Error(`No se pudo listar buckets: ${listError.message}`);

  if (existentes?.some((b) => b.name === BUCKET)) {
    console.log(`Bucket "${BUCKET}" ya existe — no se recrea (idempotente).`);
  } else {
    const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/avif"],
    });
    if (error) throw new Error(`No se pudo crear el bucket: ${error.message}`);
    console.log(`Bucket "${BUCKET}" creado: público, 2 MB, PNG/JPEG/WEBP/AVIF.`);
  }

  const pathPrueba = `_setup-check-${Date.now()}.png`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(pathPrueba, PNG_PRUEBA, { contentType: "image/png" });
  if (uploadError) throw new Error(`No se pudo subir el objeto de prueba: ${uploadError.message}`);

  try {
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(pathPrueba);
    const respuesta = await fetch(data.publicUrl);
    console.log(`GET a la URL pública → status ${respuesta.status}`);
    if (respuesta.status !== 200) {
      throw new Error(`El bucket "${BUCKET}" NO es público (status ${respuesta.status}). Corregir antes de seguir.`);
    }
    console.log("bucket público ✓");
  } finally {
    await supabaseAdmin.storage.from(BUCKET).remove([pathPrueba]);
    console.log("Objeto de prueba borrado.");
  }
}

main().catch((e) => {
  console.error("\nFALLÓ EL SETUP:\n");
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
