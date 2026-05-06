import prisma from "@/lib/prisma";

export class NoticiaRepository {
  static async getLatest() {
    return prisma.noticia.findMany({
      orderBy: { publicada_en: "desc" },
    });
  }

  static async getById(id: string) {
    return prisma.noticia.findUnique({
      where: { id },
    });
  }

  static async getBySlug(slug: string) {
    return prisma.noticia.findUnique({
      where: { slug },
    });
  }
}
