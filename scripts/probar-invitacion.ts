/**
 * Prueba de punta a punta del flujo de invitación, contra UNA sola dirección.
 *
 * Reproduce exactamente lo que van a recibir los profesionales: mismo
 * `inviteUserByEmail`, mismo `redirectTo`, mismo SMTP. NO toca la base de
 * datos — no crea ni vincula ningún Profesional. Es solo Auth.
 *
 * Invitar:
 *   EMAIL=vos+prueba@gmail.com npx tsx scripts/probar-invitacion.ts
 *
 * Limpiar cuando terminaste (borra la identidad de prueba de Auth):
 *   EMAIL=vos+prueba@gmail.com BORRAR=true npx tsx scripts/probar-invitacion.ts
 *
 * Tip: usá un alias con "+" de tu propio Gmail. Para Supabase es una dirección
 * distinta (así no choca con tu cuenta real), pero el mail cae en tu inbox.
 */

import { createClient, type User } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { construirUrlAbsoluta, normalizarBaseUrl } from "../src/lib/site";

dotenv.config({ path: ".env" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const EMAIL = process.env.EMAIL;
const BORRAR = process.env.BORRAR === "true";

const BASE_URL = normalizarBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
const DESTINO = construirUrlAbsoluta("auth/callback?next=/auth/set-password", BASE_URL);

async function buscarPorEmail(email: string): Promise<User | undefined> {
  const porPagina = 1000;
  for (let pagina = 1; ; pagina++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: pagina,
      perPage: porPagina,
    });
    if (error) throw new Error(`No pude listar usuarios: ${error.message}`);

    const encontrado = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (encontrado) return encontrado;
    if (data.users.length < porPagina) return undefined;
  }
}

async function main() {
  if (!EMAIL) {
    console.error("\n❌ Falta EMAIL.\n   EMAIL=vos+prueba@gmail.com npx tsx scripts/probar-invitacion.ts\n");
    process.exit(1);
  }

  if (BORRAR) {
    const usuario = await buscarPorEmail(EMAIL);
    if (!usuario) {
      console.log(`\n✅ No hay identidad de prueba para ${EMAIL}. Nada que borrar.\n`);
      return;
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(usuario.id);
    if (error) throw new Error(error.message);
    console.log(`\n🧹 Identidad de prueba borrada: ${EMAIL}\n`);
    return;
  }

  console.log(`\n📨 Invitando a: ${EMAIL}`);
  console.log(`🔗 El link va a apuntar a: ${DESTINO}\n`);

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(EMAIL, {
    data: { full_name: "Profesional de Prueba" },
    redirectTo: DESTINO,
  });

  if (error) {
    console.error(`❌ Falló la invitación: ${error.message}`);
    if (error.message.toLowerCase().includes("already")) {
      console.error("   Esa dirección ya existe en Auth. Borrala primero con BORRAR=true, o usá otro alias.");
    }
    process.exit(1);
  }

  console.log("✅ Invitación enviada.");
  console.log(`   user id  : ${data.user.id}`);
  console.log(`   invitado : ${data.user.invited_at}\n`);
  console.log("Ahora, en tu inbox:");
  console.log("  1. El remitente tiene que ser no-reply@kinesiologosmza.com.ar");
  console.log("  2. Abrí el link → tiene que llevarte a /auth/set-password (no a localhost)");
  console.log("  3. Elegí una contraseña → tenés que caer en /mi-panel ya logueado");
  console.log("  4. Cerrá sesión y volvé a entrar por /login con esa contraseña");
  console.log("\nCuando termines, limpiá con BORRAR=true.\n");
}

main().catch((err) => {
  console.error("Error fatal:", err.message);
  process.exit(1);
});
