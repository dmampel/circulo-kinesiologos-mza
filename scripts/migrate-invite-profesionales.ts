/**
 * Script de migración: Invitar profesionales existentes a Supabase Auth
 *
 * Uso:
 *   npx tsx scripts/migrate-invite-profesionales.ts
 *
 * Modo dry-run (sin hacer nada real):
 *   DRY_RUN=true npx tsx scripts/migrate-invite-profesionales.ts
 *
 * Este script es IDEMPOTENTE: si un profesional ya tiene userId o ya
 * existe en Auth, lo saltea sin error. Podés correrlo N veces sin riesgo.
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const DRY_RUN = process.env.DRY_RUN === "true";

// Pausa entre invitaciones para no saturar el rate limit de Supabase
const DELAY_MS = 500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`\n🚀 Migrate Invite Profesionales — ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  // 1. Obtener todos los profesionales sin userId y con email
  const profesionales = await prisma.profesional.findMany({
    where: {
      userId: null,
      email: { not: null },
      status: "ACTIVO",
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      matricula: true,
    },
    orderBy: { apellido: "asc" },
  });

  console.log(`📋 Profesionales sin cuenta Auth: ${profesionales.length}\n`);

  if (profesionales.length === 0) {
    console.log("✅ Todos los profesionales ya tienen cuenta. Nada que hacer.");
    return;
  }

  const resultados = {
    ok: [] as string[],
    yaExistiaEnAuth: [] as string[],
    sinEmail: [] as string[],
    error: [] as { matricula: string; motivo: string }[],
  };

  for (const prof of profesionales) {
    const label = `${prof.apellido}, ${prof.nombre} (${prof.matricula})`;

    if (!prof.email) {
      console.log(`  ⚠️  Sin email — saltando: ${label}`);
      resultados.sinEmail.push(prof.matricula);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  🔍 [DRY RUN] Invitaría: ${label} → ${prof.email}`);
      resultados.ok.push(prof.matricula);
      continue;
    }

    try {
      // Intentar invitar. Si ya existe en Auth, Supabase retorna error "User already registered"
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        prof.email,
        {
          data: { full_name: `${prof.nombre} ${prof.apellido}` },
          redirectTo: `${SITE_URL}/auth/callback?next=/auth/set-password`,
        }
      );

      if (error) {
        // Ya existe en Auth — buscar su userId para sincronizar
        if (
          error.message.includes("already been registered") ||
          error.message.includes("already registered") ||
          error.message.includes("already exists")
        ) {
          console.log(`  🔄 Ya existe en Auth — sincronizando userId: ${label}`);

          // Buscar el usuario en Auth por email
          const { data: listData, error: listError } =
            await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

          if (listError) throw new Error(`No pude listar usuarios: ${listError.message}`);

          const authUser = listData.users.find(
            (u) => u.email?.toLowerCase() === prof.email!.toLowerCase()
          );

          if (!authUser) throw new Error(`Existe en Auth pero no lo encontré en la lista`);

          await prisma.profesional.update({
            where: { id: prof.id },
            data: { userId: authUser.id },
          });

          console.log(`  ✅ Sincronizado: ${label}`);
          resultados.yaExistiaEnAuth.push(prof.matricula);
        } else {
          throw new Error(error.message);
        }
      } else {
        // Invitación creada — guardar userId
        const authUserId = data.user.id;

        await prisma.profesional.update({
          where: { id: prof.id },
          data: { userId: authUserId },
        });

        console.log(`  ✅ Invitado y vinculado: ${label}`);
        resultados.ok.push(prof.matricula);

        // Respetar rate limit
        await sleep(DELAY_MS);
      }
    } catch (err: any) {
      console.error(`  ❌ Error con ${label}: ${err.message}`);
      resultados.error.push({ matricula: prof.matricula, motivo: err.message });
    }
  }

  // Resumen final
  console.log("\n─────────────────────────────────────────");
  console.log("📊 RESUMEN");
  console.log(`  ✅ Invitados correctamente : ${resultados.ok.length}`);
  console.log(`  🔄 Ya existían en Auth     : ${resultados.yaExistiaEnAuth.length}`);
  console.log(`  ⚠️  Sin email              : ${resultados.sinEmail.length}`);
  console.log(`  ❌ Con error               : ${resultados.error.length}`);

  if (resultados.error.length > 0) {
    console.log("\n❌ Fallidos (podés reintentarlos):");
    for (const e of resultados.error) {
      console.log(`   - ${e.matricula}: ${e.motivo}`);
    }
    process.exit(1); // Exit code 1 para que se note en CI o scripts
  }

  console.log("\n🎉 Migración completada.\n");
}

main()
  .catch((err) => {
    console.error("Error fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
