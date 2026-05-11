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

  static async findFeatured(limit = 3) {
    return prisma.beneficioKineClub.findMany({
      where: { activa: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { categoria: true },
    });
  }

  static async findRandom(limit = 3) {
    const todos = await prisma.beneficioKineClub.findMany({
      where: { activa: true },
      include: { categoria: true },
    });
    for (let i = todos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [todos[i], todos[j]] = [todos[j], todos[i]];
    }
    return todos.slice(0, limit);
  }
}
