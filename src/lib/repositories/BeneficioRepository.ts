import prisma from "@/lib/prisma";

export class BeneficioRepository {
  static async getAll(category?: string) {
    return prisma.beneficioKineClub.findMany({
      where: category && category !== "TODOS" ? { categoria: category as any } : {},
      orderBy: { createdAt: "desc" },
    });
  }
}
