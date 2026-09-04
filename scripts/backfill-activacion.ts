/**
 * Backfill de la marca de activación sobre las cuentas anteriores al change
 * `activacion-cuenta-socio`.
 *
 * POR QUÉ EXISTE: el guard nuevo trata "sin marca" como "sin activar". Hoy
 * nadie tiene marca, ni siquiera los socios que entran perfectamente todos los
 * días. Sin esta reconciliación previa, el fix le rompe el acceso justo a los
 * que funcionan: los manda a redefinir su contraseña, tipean la de siempre y
 * cosechan "esa es la que ya tenías".
 *
 * CÓMO DECIDE: una cuenta tiene contraseña propia si y sólo si
 * `auth.users.encrypted_password` no es nulo ni vacío. `inviteUserByEmail` no
 * la escribe; `resetPasswordForEmail` tampoco. La columna se llena únicamente
 * cuando alguien completó `updateUser({ password })` o un signUp con
 * contraseña. Es el predicado "activación completada" MEDIDO, no estimado.
 *
 * MÉTODO DESCARTADO (no lo reintroduzcas): el delta entre `updated_at` y
 * `last_sign_in_at`. Un socio que activó bien y más tarde volvió a entrar pisa
 * ambos timestamps con ese login nuevo y da delta ≈ 0, indistinguible de quien
 * nunca definió contraseña. Aplicado al padrón dio 11 falsos positivos sobre 11.
 *
 * LEE por SQL crudo y ESCRIBE por la Admin API. Nunca hace `UPDATE` directo
 * sobre `auth.users`: el esquema `auth` lo gestiona Supabase y escribirle a
 * mano se sale del contrato soportado. Leerlo, no.
 *
 * ES IDEMPOTENTE: sólo escribe donde la marca está ausente. Se corre dos veces
 * a propósito — antes del deploy y otra vez inmediatamente después — para
 * cerrar la ventana de los socios que activan entre un paso y el otro.
 *
 * Uso:
 *   npx tsx scripts/backfill-activacion.ts              # ensayo, NO escribe
 *   npx tsx scripts/backfill-activacion.ts --dry-run    # idem, explícito
 *   npx tsx scripts/backfill-activacion.ts --escribir   # escribe de verdad
 *
 * El ensayo es el modo POR DEFECTO y la escritura pide un flag propio: esto
 * toca las cuentas de 244 personas reales y una corrida por accidente no puede
 * costar nada. Comparar el conteo del ensayo contra la línea de base conocida
 * ANTES de escribir es la puerta de calidad del change.
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import {
  CLAVE_ACTIVACION,
  CLAVE_ORIGEN_ACTIVACION,
} from "../src/lib/activacion";

dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

// Igual que el resto de los scripts: el cliente se arma DESPUÉS de dotenv.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ESCRIBIR = process.argv.includes("--escribir");
/** Pausa entre escrituras: la Admin API tiene límites de tasa y un lote que
 *  falla a la mitad en silencio es peor que uno lento. */
const PAUSA_MS = 120;

type Cuenta = {
  id: string;
  email: string | null;
  tiene_password: boolean;
  tiene_marca: boolean;
  updated_at: Date | null;
  created_at: Date | null;
  metadata: Record<string, unknown> | null;
  vinculado: boolean;
};

/**
 * `encrypted_password` es una columna interna de Supabase: podría cambiar de
 * nombre o de semántica en una versión futura de GoTrue. Si eso pasa, este
 * script tiene que FALLAR A LOS GRITOS. La alternativa silenciosa —marcar cero
 * cuentas y reportar "todo en orden"— desemboca en un deploy que le rompe el
 * acceso a todo el padrón activo, y nadie se entera hasta que suena el teléfono.
 */
async function verificarColumna(): Promise<void> {
  const filas: { column_name: string }[] = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users'
      AND column_name = 'encrypted_password'
  `);

  if (filas.length === 0) {
    throw new Error(
      "auth.users.encrypted_password NO EXISTE o no es visible con esta DATABASE_URL.\n" +
        "Es la única señal concluyente de que una cuenta tiene contraseña propia.\n" +
        "SIN ELLA ESTE BACKFILL NO PUEDE DECIDIR NADA: abortado a propósito, en vez\n" +
        "de marcar cero cuentas y dejar que el deploy trabe a todo el padrón activo."
    );
  }
}

async function traerCuentas(): Promise<Cuenta[]> {
  const filas: Cuenta[] = await prisma.$queryRawUnsafe(`
    SELECT u.id::text AS id,
           u.email,
           (u.encrypted_password IS NOT NULL AND u.encrypted_password <> '') AS tiene_password,
           (COALESCE(u.raw_user_meta_data->>'${CLAVE_ACTIVACION}', '') <> '') AS tiene_marca,
           u.updated_at,
           u.created_at,
           u.raw_user_meta_data AS metadata,
           (p."userId" IS NOT NULL) AS vinculado
    FROM auth.users u
    LEFT JOIN "Profesional" p ON p."userId" = u.id::text
    WHERE u.deleted_at IS NULL
    ORDER BY u.created_at
  `);

  // Segunda red de contención: la consulta anduvo, pero si el booleano no llegó
  // (columna renombrada, driver que la devuelve como otra cosa) tampoco se puede
  // decidir. Cero cuentas por un `undefined` silencioso es el modo de falla que
  // este chequeo existe para impedir.
  const rota = filas.find((f) => typeof f.tiene_password !== "boolean");
  if (rota) {
    throw new Error(
      `La consulta no devolvió 'tiene_password' como booleano para la cuenta ${rota.id} ` +
        `(llegó: ${typeof rota.tiene_password}). Abortado: sin ese dato el backfill no puede decidir.`
    );
  }

  return filas;
}

/**
 * Se usa `updated_at` de la cuenta como instante de activación: es la última
 * modificación conocida, y para una cuenta con contraseña esa modificación fue,
 * casi siempre, el momento en que la definió. Es una fecha INFERIDA, y por eso
 * queda etiquetada con `activacion_origen: "backfill"` — para no confundir lo
 * medido con lo deducido cuando se mire la métrica.
 */
const instanteDe = (cuenta: Cuenta): string =>
  (cuenta.updated_at ?? cuenta.created_at ?? new Date()).toISOString();

async function main() {
  await verificarColumna();
  const cuentas = await traerCuentas();

  const conPassword = cuentas.filter((c) => c.tiene_password);
  const sinPassword = cuentas.filter((c) => !c.tiene_password);
  const yaMarcadas = conPassword.filter((c) => c.tiene_marca);
  const aMarcar = conPassword.filter((c) => !c.tiene_marca);
  // Entraron alguna vez y no tienen contraseña: el caso que el change viene a
  // hacer visible. El backfill NO los toca — quedan sujetos al guard, que es el
  // resultado buscado. Se los cuenta para comparar contra la línea de base.
  const sinPasswordVinculadas = sinPassword.filter((c) => c.vinculado);

  console.log("\n╔" + "═".repeat(70) + "╗");
  console.log("║  BACKFILL DE ACTIVACIÓN" + " ".repeat(47) + "║");
  console.log("╚" + "═".repeat(70) + "╝\n");
  console.log(ESCRIBIR ? "MODO: ESCRITURA\n" : "MODO: ENSAYO (--dry-run) — no se escribe nada\n");

  console.log(`Cuentas de Auth (no borradas) ........ ${cuentas.length}`);
  console.log(`  Con contraseña propia .............. ${conPassword.length}`);
  console.log(`  Sin contraseña ..................... ${sinPassword.length}  (${sinPasswordVinculadas.length} vinculadas al padrón)`);
  console.log(`  Con marca previa (no se tocan) ..... ${yaMarcadas.length}`);
  console.log(`  A marcar ........................... ${aMarcar.length}\n`);

  if (aMarcar.length === 0) {
    console.log("Nada que hacer: todas las cuentas con contraseña ya tienen su marca.\n");
    return;
  }

  console.log(ESCRIBIR ? "Marcando:" : "Se marcarían:");
  console.log("─".repeat(90));
  for (const cuenta of aMarcar) {
    console.log(
      `${(cuenta.email ?? "sin email").padEnd(40)} ${cuenta.id}  ${instanteDe(cuenta).slice(0, 16).replace("T", " ")}`
    );
  }
  console.log("");

  if (!ESCRIBIR) {
    console.log(
      "Ensayo terminado. NO se escribió nada.\n\n" +
        "Antes de escribir, compará el número de arriba contra la línea de base del día\n" +
        "(npx tsx scripts/listar-socios-en-limbo.ts). Si no cierra, PARÁ: de menos\n" +
        "significa que hay socios en funcionamiento que el backfill no va a cubrir, y\n" +
        "esos son los que van a quedar trabados el día del deploy.\n\n" +
        "Para escribir de verdad:\n" +
        "  npx tsx scripts/backfill-activacion.ts --escribir\n"
    );
    return;
  }

  let escritas = 0;
  const errores: { email: string; id: string; motivo: string }[] = [];

  for (const cuenta of aMarcar) {
    // Se reenvía la metadata existente junto con las claves nuevas. La Admin API
    // mergea, pero mandar el objeto completo deja el resultado idéntico bajo
    // cualquiera de las dos semánticas y nos ahorra depender de ese detalle.
    const { error } = await supabaseAdmin.auth.admin.updateUserById(cuenta.id, {
      user_metadata: {
        ...(cuenta.metadata ?? {}),
        [CLAVE_ACTIVACION]: instanteDe(cuenta),
        [CLAVE_ORIGEN_ACTIVACION]: "backfill",
      },
    });

    if (error) {
      errores.push({ email: cuenta.email ?? "sin email", id: cuenta.id, motivo: error.message });
    } else {
      escritas += 1;
    }

    await new Promise((resolve) => setTimeout(resolve, PAUSA_MS));
  }

  console.log("─".repeat(90));
  console.log("RESUMEN");
  console.log(`  Cuentas con contraseña ............. ${conPassword.length}`);
  console.log(`  Cuentas sin contraseña ............. ${sinPassword.length}`);
  console.log(`  Marcas escritas .................... ${escritas}`);
  console.log(`  Marcas ya presentes (sin tocar) .... ${yaMarcadas.length}`);
  console.log(`  Errores ............................ ${errores.length}`);

  if (errores.length) {
    console.log("\nERRORES POR CUENTA — estas quedan sin marca y el guard las va a trabar:");
    for (const e of errores) {
      console.log(`  ${e.email.padEnd(40)} ${e.id}  ${e.motivo}`);
    }
    console.log("\nVolvé a correr el script: es idempotente y sólo reintenta las que faltan.\n");
    process.exitCode = 1;
    return;
  }

  console.log("\nListo. Volvé a correrlo después del deploy para cerrar la ventana.\n");
}

main()
  .catch((e) => {
    console.error("\nFALLÓ EL BACKFILL — no se completó la reconciliación:\n");
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
