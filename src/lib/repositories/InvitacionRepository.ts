import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { activacionCompletada } from "@/lib/activacion";
import type { User } from "@supabase/supabase-js";

/**
 * Estado de activación de cada profesional del padrón.
 *
 * La fuente de verdad son dos lados que hay que cruzar:
 *  - Prisma  → `Profesional.userId` dice si el socio quedó vinculado a Auth.
 *  - Supabase Auth → `invited_at`, `email_confirmed_at` y `last_sign_in_at`
 *    dicen si el invite salió y si la persona efectivamente entró;
 *    `user_metadata` dice si además definió su contraseña.
 *
 * `ACTIVADO` significaba "abrió el link". Ahora significa "tiene contraseña
 * propia", que es lo que la palabra siempre dio a entender. Hasta este change
 * los dos números coincidían de casualidad; en cuanto alguien abriera su link
 * sin terminar de activar, el panel iba a mentir sin que nadie lo notara. Ese
 * caso ahora tiene nombre propio: `SIN_CONTRASENA`.
 *
 * `EN_LIMBO` conserva su significado de "nunca entró" en vez de reciclarse para
 * el caso nuevo: reusar la etiqueta cambiaría en silencio el sentido de un
 * número que el Círculo ya viene mirando.
 *
 * Nada de esto necesita columnas nuevas ni consultas nuevas: `listUsers` ya
 * devuelve `user_metadata` dentro del objeto `User` que se está pidiendo.
 */
export type EstadoInvitacion =
  | "ACTIVADO"
  | "SIN_CONTRASENA"
  | "EN_LIMBO"
  | "SIN_INVITAR"
  | "SIN_EMAIL"
  | "HUERFANO";

export interface InvitacionProfesional {
  id: string;
  matricula: string;
  apellido: string;
  nombre: string;
  email: string | null;
  estado: EstadoInvitacion;
  /** Cuándo salió el invite (ISO). `invited_at`, con `created_at` de respaldo. */
  invitadoEl: string | null;
  /** Último ingreso real a la web (ISO). */
  ultimoIngreso: string | null;
}

/** Una tanda = un día de envío. No se numera a mano: se agrupa por fecha. */
export interface TandaInvitacion {
  fecha: string;
  invitados: number;
  entraron: number;
  enLimbo: number;
  huerfanos: number;
  porcentaje: number;
}

export interface ResumenInvitaciones {
  generadoEl: string;
  total: number;
  invitados: number;
  activados: number;
  /** Entraron por el link pero nunca guardaron contraseña. Campo agregado: los
   *  consumidores que no lo miran siguen compilando igual. */
  sinContrasena: number;
  enLimbo: number;
  sinInvitar: number;
  sinEmail: number;
  huerfanos: number;
  cuentasAuth: number;
  tandas: TandaInvitacion[];
  profesionales: InvitacionProfesional[];
}

/** Zona horaria del Círculo: define en qué día cae cada tanda. */
const ZONA_HORARIA = "America/Argentina/Mendoza";

const formateadorDeDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Devuelve YYYY-MM-DD en hora de Mendoza, que es como se agrupan las tandas. */
export function diaDeEnvio(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return formateadorDeDia.format(fecha);
}

const aIso = (valor: string | null | undefined): string | null => {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
};

export class InvitacionRepository {
  /**
   * `listUsers` pagina de a 1000: hay que recorrer todas las páginas o se
   * pierden usuarios silenciosamente.
   */
  private static async traerUsuariosAuth(): Promise<User[]> {
    const usuarios: User[] = [];
    const porPagina = 1000;

    for (let pagina = 1; ; pagina++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: pagina,
        perPage: porPagina,
      });

      if (error) {
        throw new Error(`No pude listar usuarios de Auth: ${error.message}`);
      }

      usuarios.push(...data.users);
      if (data.users.length < porPagina) break;
    }

    return usuarios;
  }

  /** Foto completa del estado de invitaciones, siempre recalculada en vivo. */
  static async getResumen(): Promise<ResumenInvitaciones> {
    const [profesionales, usuariosAuth] = await Promise.all([
      prisma.profesional.findMany({
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          matricula: true,
          userId: true,
        },
        orderBy: { apellido: "asc" },
      }),
      this.traerUsuariosAuth(),
    ]);

    const porId = new Map(usuariosAuth.map((usuario) => [usuario.id, usuario]));

    const filas: InvitacionProfesional[] = profesionales.map((profesional) => {
      const base = {
        id: profesional.id,
        matricula: profesional.matricula,
        apellido: profesional.apellido,
        nombre: profesional.nombre,
        email: profesional.email,
      };

      if (!profesional.userId) {
        return {
          ...base,
          estado: profesional.email ? "SIN_INVITAR" : "SIN_EMAIL",
          invitadoEl: null,
          ultimoIngreso: null,
        };
      }

      const cuenta = porId.get(profesional.userId);

      // `userId` apunta a un usuario de Auth que ya no existe: se borró a mano
      // o falló un rollback. Un reenvío de invite no lo arregla.
      if (!cuenta) {
        return { ...base, estado: "HUERFANO", invitadoEl: null, ultimoIngreso: null };
      }

      // Tres casos, en este orden:
      //   con marca de activación      → ACTIVADO       (tiene contraseña propia)
      //   sin marca, pero entró alguna vez → SIN_CONTRASENA (entró y no activó)
      //   sin marca y nunca entró      → EN_LIMBO       (la invitación no prendió)
      const entro = Boolean(cuenta.email_confirmed_at || cuenta.last_sign_in_at);
      const estado: EstadoInvitacion = activacionCompletada(cuenta)
        ? "ACTIVADO"
        : entro
          ? "SIN_CONTRASENA"
          : "EN_LIMBO";

      return {
        ...base,
        estado,
        invitadoEl: aIso(cuenta.invited_at ?? cuenta.created_at),
        ultimoIngreso: aIso(cuenta.last_sign_in_at),
      };
    });

    const cuenta = (estado: EstadoInvitacion) =>
      filas.filter((fila) => fila.estado === estado).length;

    return {
      generadoEl: new Date().toISOString(),
      total: filas.length,
      invitados: filas.filter((fila) =>
        ["ACTIVADO", "SIN_CONTRASENA", "EN_LIMBO", "HUERFANO"].includes(fila.estado)
      ).length,
      activados: cuenta("ACTIVADO"),
      sinContrasena: cuenta("SIN_CONTRASENA"),
      enLimbo: cuenta("EN_LIMBO"),
      sinInvitar: cuenta("SIN_INVITAR"),
      sinEmail: cuenta("SIN_EMAIL"),
      huerfanos: cuenta("HUERFANO"),
      cuentasAuth: usuariosAuth.length,
      tandas: this.agruparEnTandas(filas),
      profesionales: filas,
    };
  }

  /**
   * Agrupa por día de envío. Los huérfanos no tienen fecha (se perdió la cuenta
   * de Auth), así que quedan fuera de las tandas y se cuentan aparte.
   */
  static agruparEnTandas(filas: InvitacionProfesional[]): TandaInvitacion[] {
    const porDia = new Map<string, TandaInvitacion>();

    for (const fila of filas) {
      const fecha = diaDeEnvio(fila.invitadoEl);
      if (!fecha) continue;

      const tanda =
        porDia.get(fecha) ??
        { fecha, invitados: 0, entraron: 0, enLimbo: 0, huerfanos: 0, porcentaje: 0 };

      tanda.invitados += 1;

      // CRITERIO: `SIN_CONTRASENA` NO cuenta como "entró".
      //
      // Es discutible —esa persona literalmente entró— pero lo que mide esta
      // tabla es si la tanda prendió, y alguien sin contraseña propia no puede
      // volver a entrar: funcionalmente quedó afuera. Contarlo como éxito
      // reproduce acá adentro exactamente el número falso que este change viene
      // a corregir en la métrica de arriba: se arreglaría la tarjeta de
      // "Activados" y la tabla de tandas seguiría mintiendo igual.
      //
      // Consecuencia asumida: una fila `SIN_CONTRASENA` suma en `invitados` y no
      // suma ni en `entraron` ni en `enLimbo`, así que las dos columnas pueden no
      // sumar el total de la tanda. Se prefiere eso —visible y honesto— antes que
      // meterla en `enLimbo`, que significa "nunca entró" y se volvería a mezclar
      // el caso nuevo con el viejo. Si el hueco molesta, la salida es una columna
      // propia en la tabla, no reasignar el número a un balde que no le
      // corresponde.
      if (fila.estado === "ACTIVADO") tanda.entraron += 1;
      if (fila.estado === "EN_LIMBO") tanda.enLimbo += 1;

      porDia.set(fecha, tanda);
    }

    return [...porDia.values()]
      .map((tanda) => ({
        ...tanda,
        porcentaje: tanda.invitados
          ? Math.round((tanda.entraron / tanda.invitados) * 100)
          : 0,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
}
