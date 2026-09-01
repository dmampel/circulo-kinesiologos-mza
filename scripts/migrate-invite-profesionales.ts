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
import { createClient, type User } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { construirUrlAbsoluta, normalizarBaseUrl } from "../src/lib/site";

dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// La base se resuelve DESPUES de dotenv.config() y con el helper compartido:
// `normalizarBaseUrl` cae al dominio real de produccion cuando la variable no
// esta, en vez de a localhost. Un fallback a localhost aca significa mandar el
// padron entero de mails con un link muerto — que es exactamente lo que paso
// cuando el Site URL de Supabase apuntaba ahi.
const BASE_URL = normalizarBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
const DESTINO_INVITACION = construirUrlAbsoluta(
  "auth/callback?next=/auth/set-password",
  BASE_URL
);
const DRY_RUN = process.env.DRY_RUN === "true";

// Pausa entre invitaciones para no saturar el rate limit de Supabase
const DELAY_MS = 500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * `listUsers` pagina de a 1000. Antes se pedia una sola pagina y se asumia que
 * ahi entraba todo el padron: pasado ese numero un usuario que SI existe en
 * Auth queda fuera del listado y el script concluye que no existe. Ademas se
 * llamaba dentro del loop, una vez por profesional. Ahora se trae completo y
 * una sola vez.
 */
let cacheUsuariosAuth: Map<string, User> | null = null;

async function usuariosAuthPorEmail(): Promise<Map<string, User>> {
  if (cacheUsuariosAuth) return cacheUsuariosAuth;

  const usuarios: User[] = [];
  const porPagina = 1000;

  for (let pagina = 1; ; pagina++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: pagina,
      perPage: porPagina,
    });
    if (error) throw new Error(`No pude listar usuarios: ${error.message}`);

    usuarios.push(...data.users);
    if (data.users.length < porPagina) break;
  }

  cacheUsuariosAuth = new Map(
    usuarios.filter((u) => u.email).map((u) => [u.email!.toLowerCase(), u])
  );

  return cacheUsuariosAuth;
}

async function main() {
  console.log(`\n🚀 Migrate Invite Profesionales — ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`🔗 Los links de activación apuntan a: ${DESTINO_INVITACION}\n`);

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
          redirectTo: DESTINO_INVITACION,
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

          // Buscar el usuario en Auth por email (padron completo, cacheado)
          const porEmail = await usuariosAuthPorEmail();
          const authUser = porEmail.get(prof.email!.toLowerCase());

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
