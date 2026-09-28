import prisma from "@/lib/prisma";
import { Prisma, type EstadoAviso } from "@prisma/client";

// -----------------------------------------------------------------------------
// Único punto de acceso a AvisoBuscoTrabajo / AvisoBuscoKinesiologo
// (design.md — D2). Los `select` públicos NUNCA incluyen telefono, email,
// cvPath ni medioContacto: los tipos de retorno no tienen esos campos, así
// que filtrarlos por descuido en un `select` futuro requiere editar este
// archivo a propósito. Ningún otro módulo debe importar `prisma` para estas
// dos tablas (Repository Pattern, AGENTS.md pilar 1 — tasks.md 3.14).
// -----------------------------------------------------------------------------

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// --- Selects explícitos: nunca `include`, nunca objeto completo ------------

const selectPublicoBuscoTrabajo = {
  id: true,
  nombre: true,
  apellido: true,
  matricula: true,
  especialidad: { select: { id: true, nombre: true } },
  localidad: { select: { id: true, nombre: true } },
  zona: true,
  disponibilidad: true,
  presentacion: true,
  createdAt: true,
} satisfies Prisma.AvisoBuscoTrabajoSelect;

const selectPublicoBuscoKinesiologo = {
  id: true,
  institucion: true,
  localidad: { select: { id: true, nombre: true } },
  zona: true,
  area: true,
  tipoPuesto: true,
  diasHorarios: true,
  requisitos: true,
  modalidad: true,
  propuesta: true,
  fechaLimite: true,
  createdAt: true,
} satisfies Prisma.AvisoBuscoKinesiologoSelect;

const selectContactoBuscoTrabajo = {
  telefono: true,
  email: true,
  cvPath: true,
} satisfies Prisma.AvisoBuscoTrabajoSelect;

const selectContactoBuscoKinesiologo = {
  medioContacto: true,
} satisfies Prisma.AvisoBuscoKinesiologoSelect;

export type AvisoTrabajoPublico = Prisma.AvisoBuscoTrabajoGetPayload<{ select: typeof selectPublicoBuscoTrabajo }>;
export type AvisoKinesiologoPublico = Prisma.AvisoBuscoKinesiologoGetPayload<{
  select: typeof selectPublicoBuscoKinesiologo;
}>;
export type ContactoTrabajo = Prisma.AvisoBuscoTrabajoGetPayload<{ select: typeof selectContactoBuscoTrabajo }>;
export type ContactoKinesiologo = Prisma.AvisoBuscoKinesiologoGetPayload<{
  select: typeof selectContactoBuscoKinesiologo;
}>;

// --- Admin (bandeja de moderación, tasks.md — grupo 5): sí incluye contacto,
// para que el admin pueda verificar que el aviso es real antes de aprobarlo.
// Nunca se usa en una ruta pública; sólo en /admin/bolsa-de-trabajo. ----------

const selectAdminBuscoTrabajo = {
  id: true,
  nombre: true,
  apellido: true,
  matricula: true,
  telefono: true,
  email: true,
  cvPath: true,
  especialidad: { select: { id: true, nombre: true } },
  localidad: { select: { id: true, nombre: true } },
  zona: true,
  disponibilidad: true,
  presentacion: true,
  estado: true,
  createdAt: true,
} satisfies Prisma.AvisoBuscoTrabajoSelect;

const selectAdminBuscoKinesiologo = {
  id: true,
  institucion: true,
  localidad: { select: { id: true, nombre: true } },
  zona: true,
  area: true,
  tipoPuesto: true,
  diasHorarios: true,
  requisitos: true,
  modalidad: true,
  propuesta: true,
  medioContacto: true,
  fechaLimite: true,
  estado: true,
  createdAt: true,
} satisfies Prisma.AvisoBuscoKinesiologoSelect;

export type AvisoTrabajoAdmin = Prisma.AvisoBuscoTrabajoGetPayload<{ select: typeof selectAdminBuscoTrabajo }>;
export type AvisoKinesiologoAdmin = Prisma.AvisoBuscoKinesiologoGetPayload<{
  select: typeof selectAdminBuscoKinesiologo;
}>;

// --- Listados públicos vía $queryRaw (perf: 1 round-trip en vez de 2) ------
// COUNT(*) OVER() trae el total en la misma sentencia que el findMany, sin
// tocar el `where`, la paginación ni el `select` público (design.md — D2):
// las columnas de contacto NUNCA aparecen en el SELECT de estas dos queries.
// Escapa % y _ en los filtros de texto libre para igualar el comportamiento
// de `contains` de Prisma (que los trata como literales, no comodines).

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

interface RawTrabajoRow {
  id: string;
  nombre: string;
  apellido: string;
  matricula: string;
  zona: string | null;
  disponibilidad: string;
  presentacion: string;
  createdAt: Date;
  locId: string;
  locNombre: string;
  espId: string;
  espNombre: string;
  totalCount: number;
}

interface RawKinesiologoRow {
  id: string;
  institucion: string;
  zona: string | null;
  area: string;
  tipoPuesto: string;
  diasHorarios: string;
  requisitos: string;
  modalidad: string;
  propuesta: string;
  fechaLimite: Date | null;
  createdAt: Date;
  locId: string;
  locNombre: string;
  totalCount: number;
}

export interface AvisoTrabajoFiltros {
  query?: string;
  localidadId?: string;
  especialidadId?: string;
}

export interface AvisoKinesiologoFiltros {
  localidadId?: string;
  tipoPuesto?: string;
}

export interface CrearAvisoBuscoTrabajoData {
  nombre: string;
  apellido: string;
  matricula: string;
  telefono: string;
  email: string;
  cvPath?: string | null;
  especialidadId: string;
  localidadId: string;
  zona?: string;
  disponibilidad: string;
  presentacion: string;
  aceptadoEn: Date;
}

export interface CrearAvisoBuscoKinesiologoData {
  institucion: string;
  localidadId: string;
  zona?: string;
  area: string;
  tipoPuesto: string;
  diasHorarios: string;
  requisitos: string;
  modalidad: string;
  propuesta: string;
  medioContacto: string;
  fechaLimite?: Date | null;
  aceptadoEn: Date;
}

export class AvisoRepository {
  // --- Listados públicos ----------------------------------------------------

  static async findBuscoTrabajoPublicados(
    filtros: AvisoTrabajoFiltros,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<AvisoTrabajoPublico>> {
    const { query, localidadId, especialidadId } = filtros;

    const condiciones: Prisma.Sql[] = [Prisma.sql`a.estado = 'PUBLICADO'::"EstadoAviso"`];
    if (query) {
      const patron = `%${escapeLike(query)}%`;
      condiciones.push(
        Prisma.sql`(a.nombre ILIKE ${patron} OR a.apellido ILIKE ${patron} OR a.presentacion ILIKE ${patron})`,
      );
    }
    if (localidadId) condiciones.push(Prisma.sql`a."localidadId" = ${localidadId}`);
    if (especialidadId) condiciones.push(Prisma.sql`a."especialidadId" = ${especialidadId}`);

    const filas = await prisma.$queryRaw<RawTrabajoRow[]>(Prisma.sql`
      SELECT
        a.id, a.nombre, a.apellido, a.matricula, a.zona, a.disponibilidad, a.presentacion,
        a."createdAt" AS "createdAt",
        l.id AS "locId", l.nombre AS "locNombre",
        e.id AS "espId", e.nombre AS "espNombre",
        COUNT(*) OVER()::int AS "totalCount"
      FROM "AvisoBuscoTrabajo" a
      JOIN "Localidad" l ON l.id = a."localidadId"
      JOIN "Especialidad" e ON e.id = a."especialidadId"
      WHERE ${Prisma.join(condiciones, " AND ")}
      ORDER BY a."createdAt" DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `);

    const data: AvisoTrabajoPublico[] = filas.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      apellido: f.apellido,
      matricula: f.matricula,
      especialidad: { id: f.espId, nombre: f.espNombre },
      localidad: { id: f.locId, nombre: f.locNombre },
      zona: f.zona,
      disponibilidad: f.disponibilidad,
      presentacion: f.presentacion,
      createdAt: f.createdAt,
    }));

    // ponytail: página fuera de rango (offset > filas totales) devuelve total=0
    // en vez del total real, porque COUNT(*) OVER() sólo sobrevive en las filas
    // que el LIMIT/OFFSET efectivamente devuelve. Con page validado como
    // positive-int sin tope superior (searchParams.ts) es alcanzable a mano por
    // URL. Upgrade si molesta: clamp de `page` contra un total conocido, o
    // volver a la query de count separada sólo para ese caso límite.
    return { data, total: filas.length > 0 ? filas[0]!.totalCount : 0 };
  }

  static async findBuscoKinesiologoPublicados(
    filtros: AvisoKinesiologoFiltros,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<AvisoKinesiologoPublico>> {
    const { localidadId, tipoPuesto } = filtros;
    const hoy = new Date();

    const condiciones: Prisma.Sql[] = [
      Prisma.sql`a.estado = 'PUBLICADO'::"EstadoAviso"`,
      // Vencimiento (design.md — D7): sin cron, un filtro más en la consulta.
      Prisma.sql`(a."fechaLimite" IS NULL OR a."fechaLimite" >= ${hoy})`,
    ];
    if (localidadId) condiciones.push(Prisma.sql`a."localidadId" = ${localidadId}`);
    if (tipoPuesto) {
      condiciones.push(Prisma.sql`a."tipoPuesto" ILIKE ${`%${escapeLike(tipoPuesto)}%`}`);
    }

    const filas = await prisma.$queryRaw<RawKinesiologoRow[]>(Prisma.sql`
      SELECT
        a.id, a.institucion, a.zona, a.area, a."tipoPuesto", a."diasHorarios", a.requisitos,
        a.modalidad, a.propuesta, a."fechaLimite" AS "fechaLimite", a."createdAt" AS "createdAt",
        l.id AS "locId", l.nombre AS "locNombre",
        COUNT(*) OVER()::int AS "totalCount"
      FROM "AvisoBuscoKinesiologo" a
      JOIN "Localidad" l ON l.id = a."localidadId"
      WHERE ${Prisma.join(condiciones, " AND ")}
      ORDER BY a."createdAt" DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `);

    const data: AvisoKinesiologoPublico[] = filas.map((f) => ({
      id: f.id,
      institucion: f.institucion,
      localidad: { id: f.locId, nombre: f.locNombre },
      zona: f.zona,
      area: f.area,
      tipoPuesto: f.tipoPuesto,
      diasHorarios: f.diasHorarios,
      requisitos: f.requisitos,
      modalidad: f.modalidad,
      propuesta: f.propuesta,
      fechaLimite: f.fechaLimite,
      createdAt: f.createdAt,
    }));

    // ponytail: mismo tradeoff de página fuera de rango que en
    // findBuscoTrabajoPublicados — ver comentario ahí.
    return { data, total: filas.length > 0 ? filas[0]!.totalCount : 0 };
  }

  // --- Contacto por id (design.md — D3): sólo avisos PUBLICADO -------------

  static async findContactoBuscoTrabajo(id: string): Promise<ContactoTrabajo | null> {
    const aviso = await prisma.avisoBuscoTrabajo.findFirst({
      where: { id, estado: "PUBLICADO" },
      select: selectContactoBuscoTrabajo,
    });
    return aviso ?? null;
  }

  static async findContactoBuscoKinesiologo(id: string): Promise<ContactoKinesiologo | null> {
    const aviso = await prisma.avisoBuscoKinesiologo.findFirst({
      where: { id, estado: "PUBLICADO" },
      select: selectContactoBuscoKinesiologo,
    });
    return aviso ?? null;
  }

  // --- Alta (estado arranca en PENDIENTE — moderación confirmada, D6) ------

  static async crearBuscoTrabajo(data: CrearAvisoBuscoTrabajoData): Promise<{ id: string }> {
    const aviso = await prisma.avisoBuscoTrabajo.create({
      data: { ...data, aceptaDifusion: true },
      select: { id: true },
    });
    return aviso;
  }

  static async crearBuscoKinesiologo(data: CrearAvisoBuscoKinesiologoData): Promise<{ id: string }> {
    const aviso = await prisma.avisoBuscoKinesiologo.create({
      data: { ...data, aceptaDifusion: true },
      select: { id: true },
    });
    return aviso;
  }

  // --- Admin (bandeja de moderación, tasks.md — 5.1/5.2) --------------------

  static async findAllBuscoTrabajo(estado?: EstadoAviso): Promise<AvisoTrabajoAdmin[]> {
    return prisma.avisoBuscoTrabajo.findMany({
      where: estado ? { estado } : undefined,
      select: selectAdminBuscoTrabajo,
      orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
    });
  }

  static async findAllBuscoKinesiologo(estado?: EstadoAviso): Promise<AvisoKinesiologoAdmin[]> {
    return prisma.avisoBuscoKinesiologo.findMany({
      where: estado ? { estado } : undefined,
      select: selectAdminBuscoKinesiologo,
      orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
    });
  }

  static async countPendientes(): Promise<{ trabajo: number; kinesiologo: number }> {
    const [trabajo, kinesiologo] = await Promise.all([
      prisma.avisoBuscoTrabajo.count({ where: { estado: "PENDIENTE" } }),
      prisma.avisoBuscoKinesiologo.count({ where: { estado: "PENDIENTE" } }),
    ]);
    return { trabajo, kinesiologo };
  }

  static async actualizarEstadoBuscoTrabajo(id: string, estado: EstadoAviso): Promise<void> {
    await prisma.avisoBuscoTrabajo.update({ where: { id }, data: { estado } });
  }

  static async actualizarEstadoBuscoKinesiologo(id: string, estado: EstadoAviso): Promise<void> {
    await prisma.avisoBuscoKinesiologo.update({ where: { id }, data: { estado } });
  }
}
