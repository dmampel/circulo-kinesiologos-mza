import prisma from "@/lib/prisma";

export class BeneficioRepository {
  static async getAll(category?: string) {
    return prisma.beneficioKineClub.findMany({
      where: category && category !== "TODOS" ? { 
        categoria: {
          slug: category.toLowerCase()
        }
      } : {},
      include: {
        categoria: true
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
