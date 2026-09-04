/**
 * Monitor: socios que abrieron su link de invitación o de reset, entraron con
 * la sesión que ese link les dio, pero NUNCA definieron una contraseña propia.
 *
 * SOLO LEE. No escribe en la base, no toca Supabase Auth, no manda mails.
 *
 * Uso:
 *   npx tsx scripts/listar-socios-en-limbo.ts
 *
 * QUÉ DETECTA: el flujo de activación no distingue "hizo click en el mail" de
 * "definió su contraseña". Quien abandona entre un paso y el otro queda con la
 * cuenta viva, con sesión, sin contraseña propia y figurando ACTIVO en el
 * panel. Cuando la sesión del link se le vence, no puede volver a entrar y
 * nadie se entera hasta que llama.
 *
 * CÓMO LO DETECTA: `auth.users.encrypted_password` se llena únicamente cuando
 * alguien completa `updateUser({ password })` o un signUp. Ni
 * `inviteUserByEmail` ni `resetPasswordForEmail` la escriben. Verificado contra
 * producción el 2026-09-04: de 244 profesionales vinculados, los 197 que nunca
 * ingresaron tenían la columna vacía y los 47 que ingresaron la tenían llena —
 * separación perfecta, sin zona gris.
 *
 * MÉTODO DESCARTADO (no lo reintroduzcas): comparar el delta entre
 * `updated_at` y `last_sign_in_at` para inferir si hubo un cambio de
 * contraseña posterior al login. Parece funcionar y NO funciona: un socio que
 * activó bien y más tarde volvió a entrar con su contraseña pisa ambos
 * timestamps con ese login nuevo y da delta ≈ 0, idéntico a alguien que nunca
 * la definió. Esa heurística reportó 11 falsos positivos sobre 11 casos.
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

type Fila = {
  apellido: string;
  nombre: string;
  matricula: string;
  email: string | null;
  telefono: string | null;
  whatsapp: string | null;
  tiene_password: boolean;
  invited_at: Date | null;
  recovery_sent_at: Date | null;
  last_sign_in_at: Date | null;
};

const contacto = (f: Fila) => f.whatsapp || f.telefono || "sin teléfono";
const fecha = (d: Date | null) =>
  d ? new Date(d).toISOString().slice(0, 16).replace("T", " ") : "-";

async function main() {
  const filas: Fila[] = await prisma.$queryRawUnsafe(`
    SELECT p.apellido, p.nombre, p.matricula, p.email, p.telefono, p.whatsapp,
           (u.encrypted_password IS NOT NULL AND u.encrypted_password <> '') AS tiene_password,
           u.invited_at, u.recovery_sent_at, u.last_sign_in_at
    FROM "Profesional" p
    JOIN auth.users u ON u.id::text = p."userId"
    WHERE p."userId" IS NOT NULL AND u.deleted_at IS NULL
    ORDER BY p.apellido, p.nombre
  `);

  const entraron = filas.filter((f) => f.last_sign_in_at);
  const enLimbo = entraron.filter((f) => !f.tiene_password);
  const nuncaEntraron = filas.filter((f) => !f.last_sign_in_at);
  const activados = filas.filter((f) => f.tiene_password);

  console.log("\n╔" + "═".repeat(78) + "╗");
  console.log("║  ESTADO REAL DE ACTIVACIÓN DEL PADRÓN" + " ".repeat(41) + "║");
  console.log("╚" + "═".repeat(78) + "╝\n");

  const pct = (n: number) => `${((n / filas.length) * 100).toFixed(1)}%`;
  console.log(`Profesionales vinculados a una cuenta ...... ${filas.length}`);
  console.log(`  Con contraseña propia (activados) ........ ${activados.length}  (${pct(activados.length)})`);
  console.log(`  Nunca abrieron el link ................... ${nuncaEntraron.length}  (${pct(nuncaEntraron.length)})`);
  console.log(`  ENTRARON PERO SIN CONTRASEÑA (limbo) ..... ${enLimbo.length}  (${pct(enLimbo.length)})`);

  if (!enLimbo.length) {
    console.log("\n✅ Nadie en limbo: todos los que entraron tienen contraseña propia.\n");
    return;
  }

  console.log("\n🔴 EN LIMBO — escribirles");
  console.log("─".repeat(100));
  for (const f of enLimbo) {
    const via = f.recovery_sent_at ? "reset" : "invitación";
    console.log(
      `${`${f.apellido}, ${f.nombre}`.padEnd(32)} ${f.matricula.padEnd(9)} ` +
        `${(f.email ?? "sin email").padEnd(32)} ${contacto(f).padEnd(16)} ` +
        `link ${via} usado ${fecha(f.last_sign_in_at)}`
    );
  }
  console.log(
    "\nQué decirles: que pidan un enlace nuevo desde «¿Olvidaste tu contraseña?»,\n" +
      "que lo abran en Chrome o Safari (no desde el navegador del mail) y que\n" +
      "elijan una contraseña de 6 caracteres o más.\n"
  );
}

main().finally(() => prisma.$disconnect());
