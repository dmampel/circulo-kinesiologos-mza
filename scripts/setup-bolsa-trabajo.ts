/**
 * Setup de infraestructura Supabase para el change `bolsa-de-trabajo`
 * (`openspec/changes/bolsa-de-trabajo/tasks.md`, grupo 2).
 *
 * Hace dos cosas, cada una verificada después de ejecutarla (no se da por
 * hecho que un comando sin error significa éxito):
 *
 * 1. Habilita RLS en `AvisoBuscoTrabajo` y `AvisoBuscoKinesiologo`
 *    (AGENTS.md, pilar 5) y confirma con `pg_class.relrowsecurity`.
 * 2. Crea el bucket privado `bolsa-trabajo-cv` (5 MB, PDF/DOC/DOCX) y sube +
 *    borra un objeto de prueba para confirmar que NO es accesible por URL
 *    pública.
 *
 * Es idempotente: si el bucket ya existe, lo reporta y sigue.
 *
 * Uso: npx tsx scripts/setup-bolsa-trabajo.ts
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = "bolsa-trabajo-cv";
const TABLAS = ["AvisoBuscoTrabajo", "AvisoBuscoKinesiologo"] as const;

async function habilitarRLS() {
  console.log("── RLS ──────────────────────────────────────────────");
  for (const tabla of TABLAS) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${tabla}" ENABLE ROW LEVEL SECURITY;`);
    console.log(`  ALTER TABLE "${tabla}" ENABLE ROW LEVEL SECURITY; — ejecutado`);
  }

  // No dar por hecho que "sin error" == "habilitado": se verifica leyendo
  // pg_class.relrowsecurity, que es la fuente de verdad de Postgres.
  const filas: { relname: string; relrowsecurity: boolean }[] = await prisma.$queryRawUnsafe(`
    SELECT relname, relrowsecurity
    FROM pg_class
    WHERE relname IN ('AvisoBuscoTrabajo', 'AvisoBuscoKinesiologo')
  `);

  console.log("\n  Verificación (pg_class.relrowsecurity):");
  let todasOk = true;
  for (const tabla of TABLAS) {
    const fila = filas.find((f) => f.relname === tabla);
    const ok = fila?.relrowsecurity === true;
    todasOk &&= ok;
    console.log(`    ${tabla}: ${ok ? "RLS habilitada ✓" : "RLS NO habilitada ✗"}`);
  }

  if (!todasOk) {
    throw new Error("RLS no quedó habilitada en alguna tabla. Ver detalle arriba.");
  }
}

async function crearBucket() {
  console.log("\n── Bucket ───────────────────────────────────────────");

  const { data: existentes, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) throw new Error(`No se pudo listar buckets: ${listError.message}`);

  const yaExiste = existentes?.some((b) => b.name === BUCKET);

  if (yaExiste) {
    console.log(`  Bucket "${BUCKET}" ya existe — no se recrea (idempotente).`);
  } else {
    const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024, // 5 MB
      allowedMimeTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    });
    if (error) throw new Error(`No se pudo crear el bucket: ${error.message}`);
    console.log(`  Bucket "${BUCKET}" creado: privado, 5 MB, PDF/DOC/DOCX.`);
  }

  // Verificación programática de que el bucket es privado: subir un objeto de
  // prueba y confirmar que getPublicUrl da una URL que NO responde 200.
  const pathPrueba = `_setup-check-${Date.now()}.pdf`;
  const contenidoPrueba = new TextEncoder().encode("%PDF-1.4 archivo de prueba de setup, se borra solo");

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(pathPrueba, contenidoPrueba, { contentType: "application/pdf" });

  if (uploadError) throw new Error(`No se pudo subir el objeto de prueba: ${uploadError.message}`);

  try {
    const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(pathPrueba);
    const respuesta = await fetch(publicUrlData.publicUrl);

    console.log(`  Objeto de prueba subido: ${pathPrueba}`);
    console.log(`  GET a la URL pública → status ${respuesta.status}`);

    if (respuesta.status === 200) {
      throw new Error(
        `El bucket "${BUCKET}" es PÚBLICO: la URL pública devolvió 200. Corregir antes de seguir.`
      );
    }
    console.log(`  Confirmado: el objeto NO es accesible por URL pública (status ${respuesta.status}).`);
  } finally {
    await supabaseAdmin.storage.from(BUCKET).remove([pathPrueba]);
    console.log(`  Objeto de prueba borrado.`);
  }
}

async function main() {
  await habilitarRLS();
  await crearBucket();
  console.log("\nSetup de bolsa-de-trabajo completo.\n");
}

main()
  .catch((e) => {
    console.error("\nFALLÓ EL SETUP:\n");
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
