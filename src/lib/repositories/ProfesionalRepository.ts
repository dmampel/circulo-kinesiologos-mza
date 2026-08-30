import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { cache } from "react";

export interface ProfesionalFilters {
  query?: string;
  localidadId?: string;
  especialidadId?: string;
  char?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface UpdateProfesionalData {
  telefono?: string;
  whatsapp?: string;
  direccion?: string;
  horarios?: string;
  foto_url?: string;
}

export class ProfesionalRepository {
  static async findPaginated(
    page: number,
    pageSize: number,
    filters: ProfesionalFilters = {}
  ): Promise<PaginatedResult<any>> {
    const { query, localidadId, especialidadId, char } = filters;

    const where: Prisma.ProfesionalWhereInput = {
      status: "ACTIVO",
      role: { not: "ADMIN" },
      AND: [
        query
          ? {
              OR: [
                { nombre: { contains: query, mode: "insensitive" } },
                { apellido: { contains: query, mode: "insensitive" } },
                { full_name: { contains: query, mode: "insensitive" } },
                { matricula: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
        char ? { apellido: { startsWith: char, mode: "insensitive" } } : {},
        localidadId ? { localidadId } : {},
        especialidadId ? { especialidades: { some: { id: especialidadId } } } : {},
      ],
    };

    const [total, data] = await Promise.all([
      prisma.profesional.count({ where }),
      prisma.profesional.findMany({
        where,
        include: {
          localidad: true,
          especialidades: true,
        },
        orderBy: { apellido: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data,
      total,
    };
  }

  static async findBySlug(slug: string) {
    return prisma.profesional.findUnique({
      where: { slug, status: "ACTIVO" },
      include: {
        localidad: true,
        especialidades: true,
      },
    });
  }

  // `cache` de React (no `unstable_cache`/`use cache`): deduplica dentro de
  // un mismo render pass (una request). El perfil es un dato privado por
  // socio y la memoización no debe sobrevivir a la request ni compartirse
  // entre usuarios (design.md — D4b). `src/app/mi-panel/layout.tsx` y
  // `src/app/mi-panel/page.tsx` llaman a este método con el mismo `userId`
  // dentro de la misma request y comparten el resultado sin coordinarse.
  static findByUserId = cache(async (userId: string) => {
    return prisma.profesional.findUnique({
      where: { userId },
      include: {
        localidad: true,
        especialidades: true,
      },
    });
  });

  static async findByEmail(email: string) {
    return prisma.profesional.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        localidad: true,
        especialidades: true,
      },
    });
  }

  static async findByMatricula(matricula: string) {
    return prisma.profesional.findUnique({
      where: { matricula },
      include: {
        localidad: true,
        especialidades: true,
      },
    });
  }

  static async findById(id: string) {
    return prisma.profesional.findUnique({
      where: { id },
      select: { id: true, nombre: true, apellido: true, matricula: true },
    });
  }

  static async findAllSlugsForSitemap() {
    return prisma.profesional.findMany({
      where: { status: "ACTIVO", role: { not: "ADMIN" } },
      select: { slug: true, updatedAt: true },
    });
  }

  static async countActive() {
    return prisma.profesional.count({ where: { status: "ACTIVO", role: { not: "ADMIN" } } });
  }

  static async update(userId: string, data: UpdateProfesionalData) {
    return prisma.profesional.update({
      where: { userId },
      data,
    });
  }
}
