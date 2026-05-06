import prisma from "@/lib/prisma";

export class LocalidadRepository {
  static async getAll() {
    return prisma.localidad.findMany({
      orderBy: { nombre: "asc" },
    });
  }
}
