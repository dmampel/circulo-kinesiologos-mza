import prisma from "@/lib/prisma";

export class InscripcionSorteoRepository {
  static async findBySorteo(sorteoId: string) {
    return prisma.inscripcionSorteo.findMany({
      where: { sorteoId },
      include: { profesional: true },
      orderBy: { createdAt: "asc" },
    });
  }

  static async inscribir(sorteoId: string, profesionalId: string) {
    return prisma.inscripcionSorteo.create({
      data: {
        sorteo: { connect: { id: sorteoId } },
        profesional: { connect: { id: profesionalId } },
      },
    });
  }

  static async desinscribir(sorteoId: string, profesionalId: string) {
    return prisma.inscripcionSorteo.delete({
      where: {
        sorteoId_profesionalId: { sorteoId, profesionalId },
      },
    });
  }

  static async findByProfesional(profesionalId: string) {
    return prisma.inscripcionSorteo.findMany({
      where: { profesionalId },
      include: { sorteo: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findOne(sorteoId: string, profesionalId: string) {
    return prisma.inscripcionSorteo.findUnique({
      where: {
        sorteoId_profesionalId: { sorteoId, profesionalId },
      },
    });
  }
}
