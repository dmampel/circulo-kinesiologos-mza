import prisma from "@/lib/prisma";

export class ObraSocialRepository {
  static async getAllActive() {
    return prisma.obraSocial.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    });
  }

  static async countActive() {
    return prisma.obraSocial.count({ where: { activa: true } });
  }
}
