import prisma from "@/lib/prisma";

export class EspecialidadRepository {
  static async getAll() {
    return prisma.especialidad.findMany({
      where: { nombre: { not: "UBICACIÓN" } },
      orderBy: { nombre: "asc" },
    });
  }
}
