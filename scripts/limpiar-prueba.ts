/**
 * Borra TODO el rastro de una prueba de registro, para una sola dirección de
 * email: Solicitud, Profesional, identidad de Supabase Auth y los archivos que
 * hayan quedado en Storage.
 *
 * No hay entorno de staging: las pruebas del flujo de registro caen en la base
 * de producción. Esto es lo que las revierte.
 *
 * Ver qué borraría (por defecto, NO borra nada):
 *   EMAIL=vos+prueba@gmail.com npx tsx scripts/limpiar-prueba.ts
 *
 * Borrar de verdad:
 *   EMAIL=vos+prueba@gmail.com CONFIRMAR=true npx tsx scripts/limpiar-prueba.ts
 *
 * SALVAGUARDA: si el Profesional tiene turnos, pacientes, inscripciones o
 * lecturas asociadas, el script se niega a borrarlo. Eso no es una cuenta de
 * prueba: es alguien que usó el sistema.
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

const EMAIL = process.env.EMAIL?.toLowerCase();
const CONFIRMAR = process.env.CONFIRMAR === "true";
const BUCKET_SOLICITUDES = "solicitudes";

async function buscarUsuarioAuth(email: string): Promise<User | undefined> {
  const porPagina = 1000;
  for (let pagina = 1; ; pagina++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: pagina,
      perPage: porPagina,
    });
    if (error) throw new Error(`No pude listar usuarios: ${error.message}`);

    const encontrado = data.users.find((u) => u.email?.toLowerCase() === email);
    if (encontrado) return encontrado;
    if (data.users.length < porPagina) return undefined;
  }
}

async function main() {
  if (!EMAIL) {
    console.error("\n❌ Falta EMAIL.\n   EMAIL=vos+prueba@gmail.com npx tsx scripts/limpiar-prueba.ts\n");
    process.exit(1);
  }

  console.log(`\n🔎 Buscando rastros de: ${EMAIL}`);
  console.log(CONFIRMAR ? "⚠️  MODO BORRADO REAL\n" : "👀 Modo inspección — no se borra nada\n");

  const [solicitudes, profesional, usuarioAuth] = await Promise.all([
    prisma.solicitud.findMany({ where: { email: { equals: EMAIL, mode: "insensitive" } } }),
    prisma.profesional.findFirst({
      where: { email: { equals: EMAIL, mode: "insensitive" } },
      include: {
        _count: {
          select: {
            turnos: true,
            pacientes: true,
            inscripcionesCapacitacion: true,
            lecturasCirculares: true,
            inscripcionesSorteo: true,
          },
        },
      },
    }),
    buscarUsuarioAuth(EMAIL),
  ]);

  const archivos = solicitudes.flatMap((s) => {
    const datos = s.datos as { archivos?: Record<string, string> } | null;
    return Object.values(datos?.archivos ?? {});
  });

  console.log(`  Solicitudes        : ${solicitudes.length}`);
  console.log(`  Profesional        : ${profesional ? `${profesional.apellido}, ${profesional.nombre} (${profesional.matricula})` : "—"}`);
  console.log(`  Usuario en Auth    : ${usuarioAuth ? usuarioAuth.id : "—"}`);
  console.log(`  Archivos en Storage: ${archivos.length}`);

  if (profesional) {
    const usos = Object.entries(profesional._count).filter(([, n]) => n > 0);
    if (usos.length > 0) {
      console.error("\n🛑 ABORTADO. Este profesional tiene actividad real asociada:");
      for (const [rel, n] of usos) console.error(`   ${rel}: ${n}`);
      console.error("   No es una cuenta de prueba. No se borró nada.\n");
      process.exit(1);
    }
  }

  if (!CONFIRMAR) {
    console.log("\nNada fue modificado. Para borrar de verdad, agregá CONFIRMAR=true.\n");
    return;
  }

  if (archivos.length > 0) {
    const { error } = await supabaseAdmin.storage.from(BUCKET_SOLICITUDES).remove(archivos);
    console.log(error ? `  ⚠️  Storage: ${error.message}` : `  🧹 Storage: ${archivos.length} archivos borrados`);
  }

  if (profesional) {
    await prisma.profesional.delete({ where: { id: profesional.id } });
    console.log(`  🧹 Profesional borrado: ${profesional.matricula}`);
  }

  if (solicitudes.length > 0) {
    await prisma.solicitud.deleteMany({ where: { id: { in: solicitudes.map((s) => s.id) } } });
    console.log(`  🧹 Solicitudes borradas: ${solicitudes.length}`);
  }

  if (usuarioAuth) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(usuarioAuth.id);
    console.log(error ? `  ⚠️  Auth: ${error.message}` : `  🧹 Identidad de Auth borrada`);
  }

  console.log("\n✅ Limpieza completa.\n");
}

main()
  .catch((err) => {
    console.error("Error fatal:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
