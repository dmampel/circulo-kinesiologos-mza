import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

export class ProfesionalRepository {
  static async findPaginated(
    page: number,
    pageSize: number,
    filters: ProfesionalFilters = {}
  ): Promise<PaginatedResult<any>> {
    const { query, localidadId, especialidadId, char } = filters;

    const where: Prisma.ProfesionalWhereInput = {
      status: "ACTIVO",
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

  static async findByUserId(userId: string) {
    return prisma.profesional.findUnique({
      where: { userId },
      include: {
        localidad: true,
        especialidades: true,
      },
    });
  }
}
