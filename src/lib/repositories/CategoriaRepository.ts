import prisma from "@/lib/prisma";

export class CategoriaRepository {
  static async getAll() {
    return prisma.categoriaBeneficio.findMany({
      orderBy: {
        nombre: "asc",
      },
    });
  }

  static async getBySlug(slug: string) {
    return prisma.categoriaBeneficio.findUnique({
      where: { slug },
    });
  }

  static async getById(id: string) {
    return prisma.categoriaBeneficio.findUnique({
      where: { id },
    });
  }
}
