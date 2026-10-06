/**
 * Migra a Storage propio los logos de beneficios que hoy apuntan a URLs externas
 * (`openspec/changes/subida-logo-beneficios`, tarea 2.2). Opcional y manual.
 *
 * Por defecto SIMULA (no sube ni escribe nada). Con `--aplicar` descarga cada
 * logo externo (timeout, tipo y tamaño validados), lo sube a `beneficios-logos`
 * y actualiza `logo_url`. Los que no se pueden descargar (links vencidos) se
 * reportan para cargarlos a mano desde el admin.
 *
 * Requiere que el bucket exista (scripts/setup-beneficios-logos.ts).
 *
 * Uso (lo corre una persona, nunca un agente):
 *   npx tsx scripts/migrar-logos-beneficios.ts            # simulación
 *   npx tsx scripts/migrar-logos-beneficios.ts --aplicar  # escribe
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

const BUCKET = "beneficios-logos";
const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 10_000;
const EXT_POR_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

const aplicar = process.argv.includes("--aplicar");

async function descargar(url: string): Promise<{ buffer: Buffer; mime: string }> {
  const respuesta = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  const mime = (respuesta.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!EXT_POR_MIME[mime]) throw new Error(`tipo no permitido (${mime || "desconocido"})`);
  const buffer = Buffer.from(await respuesta.arrayBuffer());
  if (buffer.length > MAX_BYTES) throw new Error("supera 2 MB");
  return { buffer, mime };
}

async function main() {
  console.log(aplicar ? "MODO APLICAR: se escribirá en Storage y en la base.\n" : "SIMULACIÓN (usá --aplicar para escribir).\n");

  const beneficios = await prisma.beneficioKineClub.findMany({
    where: { logo_url: { not: null } },
    select: { id: true, empresa: true, logo_url: true },
  });
  const externos = beneficios.filter((b) => b.logo_url && !b.logo_url.includes(`/${BUCKET}/`));
  console.log(`${externos.length} logo(s) externo(s) de ${beneficios.length} con logo.\n`);

  const aMano: string[] = [];
  let migrados = 0;

  for (const b of externos) {
    const url = b.logo_url as string;
    try {
      const { buffer, mime } = await descargar(url);
      if (!aplicar) {
        console.log(`  [simulación] ${b.empresa}: se migraría (${mime}, ${buffer.length} bytes)`);
        continue;
      }
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT_POR_MIME[mime]}`;
      const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, { contentType: mime });
      if (error) throw new Error(`subida: ${error.message}`);
      const nueva = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      await prisma.beneficioKineClub.update({ where: { id: b.id }, data: { logo_url: nueva } });
      migrados++;
      console.log(`  ✓ ${b.empresa}: migrado`);
    } catch (e) {
      const motivo = e instanceof Error ? e.message : String(e);
      aMano.push(`${b.empresa} (${motivo})`);
      console.log(`  ✗ ${b.empresa}: ${motivo}`);
    }
  }

  console.log(`\nMigrados: ${migrados}`);
  if (aMano.length > 0) {
    console.log("A cargar a mano desde el admin (sin cambios en la base):");
    aMano.forEach((l) => console.log(`  - ${l}`));
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
