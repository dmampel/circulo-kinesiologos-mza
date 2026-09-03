/**
 * Activar UN socio del padrón: invitarlo a Supabase Auth y vincular su
 * identidad con su fila de `Profesional`, en una sola corrida.
 *
 * Existe porque hasta ahora sólo había los dos extremos: `probar-invitacion.ts`
 * invita pero NO vincula (es de prueba, no toca la base), y
 * `migrate-invite-profesionales.ts` vincula pero invita al padrón ENTERO.
 * Activar socios de a uno — que es lo habitual — quedaba como dos pasos
 * manuales, y olvidarse del segundo deja al socio entrando a una cuenta vacía.
 *
 * Uso:
 *   MATRICULA=K-377 npx tsx scripts/invitar-socio.ts
 *   EMAIL=socio@ejemplo.com npx tsx scripts/invitar-socio.ts
 *
 * Ver qué haría, sin hacer nada:
 *   DRY_RUN=true MATRICULA=K-377 npx tsx scripts/invitar-socio.ts
 *
 * Es IDEMPOTENTE: si el socio ya tiene `userId`, o ya existe en Auth, no
 * duplica nada — sincroniza y avisa. Se puede correr N veces sin riesgo.
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

// Igual que en el resto de los scripts: la base se resuelve DESPUES de
// dotenv.config() y con el helper compartido, que cae al dominio real de
// produccion en vez de a localhost. Un link a localhost es un socio que no entra.
const BASE_URL = normalizarBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
const DESTINO = construirUrlAbsoluta("auth/callback?next=/auth/set-password", BASE_URL);

const MATRICULA = process.env.MATRICULA?.trim();
const EMAIL = process.env.EMAIL?.trim();
const DRY_RUN = process.env.DRY_RUN === "true";

/** `listUsers` pagina de a 1000: hay que recorrer todas las páginas o un usuario que SI existe queda fuera. */
async function buscarEnAuthPorEmail(email: string): Promise<User | undefined> {
  const porPagina = 1000;
  for (let pagina = 1; ; pagina++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: pagina, perPage: porPagina });
    if (error) throw new Error(`No pude listar usuarios de Auth: ${error.message}`);

    const encontrado = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (encontrado) return encontrado;
    if (data.users.length < porPagina) return undefined;
  }
}

/**
 * Escribe el `userId` en la fila del profesional. `Profesional.userId` es
 * `@unique`: si otro socio ya lo tiene, el update explota con un error de
 * Prisma poco legible. Mejor chequearlo antes y decir qué pasó.
 */
async function vincular(profesionalId: string, authUserId: string) {
  const yaTomado = await prisma.profesional.findUnique({
    where: { userId: authUserId },
    select: { apellido: true, nombre: true, matricula: true },
  });

  if (yaTomado) {
    throw new Error(
      `Ese userId de Auth ya está vinculado a ${yaTomado.apellido}, ${yaTomado.nombre} (${yaTomado.matricula}). No toco nada.`
    );
  }

  await prisma.profesional.update({ where: { id: profesionalId }, data: { userId: authUserId } });
}

async function main() {
  if (!MATRICULA && !EMAIL) {
    console.error("\n❌ Falta identificar al socio. Pasá MATRICULA o EMAIL.");
    console.error("   MATRICULA=K-377 npx tsx scripts/invitar-socio.ts\n");
    process.exit(1);
  }

  console.log(`\n🎯 Activar socio — ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`🔗 El link de activación va a apuntar a: ${DESTINO}\n`);

  const profesional = await prisma.profesional.findFirst({
    where: MATRICULA
      ? { matricula: { equals: MATRICULA, mode: "insensitive" } }
      : { email: { equals: EMAIL!, mode: "insensitive" } },
    select: {
      id: true, nombre: true, apellido: true, matricula: true,
      email: true, userId: true, status: true,
    },
  });

  if (!profesional) {
    console.error(`❌ No encontré ningún profesional con ${MATRICULA ? `matrícula ${MATRICULA}` : `email ${EMAIL}`}.`);
    process.exit(1);
  }

  const label = `${profesional.apellido}, ${profesional.nombre} (${profesional.matricula})`;
  console.log(`👤 ${label}`);
  console.log(`   email  : ${profesional.email ?? "— SIN EMAIL —"}`);
  console.log(`   status : ${profesional.status}`);
  console.log(`   userId : ${profesional.userId ?? "null (sin cuenta)"}\n`);

  if (!profesional.email) {
    console.error("❌ Este profesional no tiene email cargado. Cargáselo primero desde el admin.");
    process.exit(1);
  }

  if (profesional.status !== "ACTIVO") {
    console.error(`❌ El profesional está ${profesional.status}, no ACTIVO. No se invita a un socio dado de baja.`);
    process.exit(1);
  }

  // Ya vinculado: no hay nada que hacer. Si perdió el mail o el link venció,
  // el camino es /forgot-password, no reinvitar.
  if (profesional.userId) {
    console.log("✅ Ya tiene cuenta vinculada. Nada que hacer.");
    console.log("   Si no puede entrar (link vencido o mail perdido), que use /forgot-password.\n");
    return;
  }

  const yaEnAuth = await buscarEnAuthPorEmail(profesional.email);

  if (yaEnAuth) {
    console.log(`🔄 Ya existe en Auth (${yaEnAuth.id}) pero le faltaba el vínculo en la base.`);
    if (DRY_RUN) {
      console.log("   [DRY RUN] Le sincronizaría el userId. No invito de nuevo.\n");
      return;
    }
    await vincular(profesional.id, yaEnAuth.id);
    console.log("✅ Vinculado. La contraseña que ya haya elegido sigue siendo válida.");
    console.log("   Si todavía no la eligió, que use el link del mail original o /forgot-password.\n");
    return;
  }

  if (DRY_RUN) {
    console.log(`🔍 [DRY RUN] Invitaría a ${profesional.email} y le vincularía el userId.\n`);
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(profesional.email, {
    data: { full_name: `${profesional.nombre} ${profesional.apellido}` },
    redirectTo: DESTINO,
  });

  if (error) {
    console.error(`❌ Falló la invitación: ${error.message}`);
    process.exit(1);
  }

  // El mail ya salió: si el vínculo falla acá, el socio recibe un link que lo
  // deja en una cuenta sin perfil. Por eso el error se reporta con el userId a
  // mano, para poder completarlo sin reinvitar.
  try {
    await vincular(profesional.id, data.user.id);
  } catch (err: unknown) {
    const motivo = err instanceof Error ? err.message : "error desconocido";
    console.error(`\n⚠️  La invitación SE ENVIÓ pero no pude vincularla: ${motivo}`);
    console.error(`   userId de Auth a vincular a mano: ${data.user.id}\n`);
    process.exit(1);
  }

  console.log("✅ Invitado y vinculado.");
  console.log(`   user id : ${data.user.id}`);
  console.log(`   enviado : ${data.user.invited_at}\n`);
  console.log("El socio tiene que:");
  console.log("  1. Abrir el mail de no-reply@kinesiologosmza.com.ar");
  console.log("  2. Seguir el link → /auth/set-password");
  console.log("  3. Elegir contraseña → cae en /mi-panel con su perfil\n");
}

main()
  .catch((err) => {
    console.error("\nError fatal:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
