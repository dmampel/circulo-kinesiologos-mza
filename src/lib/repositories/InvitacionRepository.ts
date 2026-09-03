import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

/**
 * Estado de activación de cada profesional del padrón.
 *
 * La fuente de verdad son dos lados que hay que cruzar:
 *  - Prisma  → `Profesional.userId` dice si el socio quedó vinculado a Auth.
 *  - Supabase Auth → `invited_at`, `email_confirmed_at` y `last_sign_in_at`
 *    dicen si el invite salió y si la persona efectivamente entró.
 *
 * Nada de esto necesita columnas nuevas: es la misma lógica de
 * `scripts/listar-profesionales-sin-activar.ts`, expuesta para la UI.
 */
export type EstadoInvitacion =
  | "ACTIVADO"
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

      const entro = Boolean(cuenta.email_confirmed_at || cuenta.last_sign_in_at);

      return {
        ...base,
        estado: entro ? "ACTIVADO" : "EN_LIMBO",
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
        ["ACTIVADO", "EN_LIMBO", "HUERFANO"].includes(fila.estado)
      ).length,
      activados: cuenta("ACTIVADO"),
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
