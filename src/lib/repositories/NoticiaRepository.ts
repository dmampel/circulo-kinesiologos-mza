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

  static async getPaginated(page = 1, pageSize = 15) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.noticia.findMany({
        orderBy: { publicada_en: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.noticia.count(),
    ]);
    return { items, total, totalPages: Math.ceil(total / pageSize), page };
  }

  static async getBySlug(slug: string) {
    return prisma.noticia.findUnique({
      where: { slug },
    });
  }

  static async update(id: string, data: Parameters<typeof prisma.noticia.update>[0]["data"]) {
    return prisma.noticia.update({ where: { id }, data });
  }
}
