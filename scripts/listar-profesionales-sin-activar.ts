/**
 * Diagnóstico: profesionales que tienen identidad en Supabase Auth pero
 * nunca activaron la cuenta.
 *
 * SOLO LEE. No envía ningún email, no escribe en la base de datos.
 *
 * Uso:
 *   npx tsx scripts/listar-profesionales-sin-activar.ts
 *
 * Contexto: mientras el Site URL de Supabase apuntaba a localhost, todo invite
 * y todo reset de contraseña llegaba con un link muerto. Los profesionales
 * aprobados en ese período quedaron con `userId` seteado y una identidad en
 * Auth creada, pero sin contraseña: no pueden entrar, no pueden re-registrarse
 * (verificarDuplicados los frena) y el admin no puede re-aprobarlos
 * (existeMatricula.userId ya está seteado). Este script los identifica.
 */

import { PrismaClient } from "@prisma/client";
import { createClient, type User } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** listUsers pagina de a 1000: hay que recorrer todas las páginas o se pierden usuarios. */
async function traerTodosLosUsuariosAuth(): Promise<User[]> {
  const usuarios: User[] = [];
  const porPagina = 1000;

  for (let pagina = 1; ; pagina++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: pagina,
      perPage: porPagina,
    });
    if (error) throw new Error(`No pude listar usuarios de Auth: ${error.message}`);

    usuarios.push(...data.users);
    if (data.users.length < porPagina) break;
  }

  return usuarios;
}

const fecha = (valor: string | null | undefined) =>
  valor ? new Date(valor).toISOString().slice(0, 10) : "—";

async function main() {
  console.log("\n🔍 Diagnóstico de activación de cuentas — SOLO LECTURA\n");

  const [profesionales, usuariosAuth] = await Promise.all([
    prisma.profesional.findMany({
      select: {
        nombre: true,
        apellido: true,
        email: true,
        matricula: true,
        userId: true,
        status: true,
      },
      orderBy: { apellido: "asc" },
    }),
    traerTodosLosUsuariosAuth(),
  ]);

  const porId = new Map(usuariosAuth.map((u) => [u.id, u]));

  const sinInvitar = profesionales.filter((p) => !p.userId);
  const vinculados = profesionales.filter((p) => p.userId);

  const enLimbo: { label: string; email: string; invitado: string }[] = [];
  const huerfanos: string[] = [];
  let activados = 0;

  for (const prof of vinculados) {
    const label = `${prof.apellido}, ${prof.nombre} (${prof.matricula})`;
    const authUser = porId.get(prof.userId!);

    // userId apunta a un usuario de Auth que ya no existe: se borró a mano o
    // falló un rollback. No lo arregla un reenvío de invite.
    if (!authUser) {
      huerfanos.push(label);
      continue;
    }

    const nuncaConfirmo = !authUser.email_confirmed_at;
    const nuncaEntro = !authUser.last_sign_in_at;

    if (nuncaConfirmo && nuncaEntro) {
      enLimbo.push({
        label,
        email: prof.email ?? "—",
        invitado: fecha(authUser.invited_at ?? authUser.created_at),
      });
    } else {
      activados++;
    }
  }

  console.log("─────────────────────────────────────────────────────────");
  console.log("📊 RESUMEN");
  console.log(`  Profesionales en la base        : ${profesionales.length}`);
  console.log(`  Con cuenta activada             : ${activados}`);
  console.log(`  🚨 EN LIMBO (invitados, sin activar) : ${enLimbo.length}`);
  console.log(`  Sin invitar nunca (userId null) : ${sinInvitar.length}`);
  console.log(`  ⚠️  Huérfanos (userId sin usuario)   : ${huerfanos.length}`);
  console.log("─────────────────────────────────────────────────────────\n");

  if (enLimbo.length > 0) {
    console.log("🚨 EN LIMBO — son estos los que hay que reinvitar:\n");
    for (const p of enLimbo) {
      console.log(`   ${p.invitado}  ${p.label.padEnd(45)} ${p.email}`);
    }
    console.log("");
  }

  if (huerfanos.length > 0) {
    console.log("⚠️  HUÉRFANOS — userId apunta a un usuario que no existe en Auth.");
    console.log("    Estos NO se arreglan reinvitando: hay que limpiar el userId primero.\n");
    for (const label of huerfanos) console.log(`   ${label}`);
    console.log("");
  }

  console.log("Nada fue modificado. Este script solo lee.\n");
}

main()
  .catch((err) => {
    console.error("Error fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
