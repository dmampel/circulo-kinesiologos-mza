import prisma from "@/lib/prisma";

export class NoticiaRepository {
  static async getLatest() {
    return prisma.noticia.findMany({
      include: { categoria: true },
      orderBy: { publicada_en: "desc" },
    });
  }

  static async getById(id: string) {
    return prisma.noticia.findUnique({
      where: { id },
      include: { categoria: true },
    });
  }

  static async getPaginated(page = 1, pageSize = 15, category?: string, search?: string) {
    const skip = (page - 1) * pageSize;
    const withCategory = !!category && category !== "TODAS";
    const whereClause = {
      ...(withCategory ? { categoria: { slug: category!.toLowerCase() } } : {}),
      ...(search ? { OR: [
        { titulo: { contains: search, mode: "insensitive" as const } },
        { resumen: { contains: search, mode: "insensitive" as const } },
      ]} : {}),
    };

    const [items, total] = await Promise.all([
      prisma.noticia.findMany({
        where: whereClause,
        include: { categoria: true },
        orderBy: { publicada_en: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.noticia.count({ where: whereClause }),
    ]);
    return { items, total, totalPages: Math.ceil(total / pageSize), page };
  }

  static async getBySlug(slug: string) {
    return prisma.noticia.findUnique({
      where: { slug },
      include: { categoria: true },
    });
  }

  static async getRelated(currentId: string, categoriaId: string | null, limit = 5) {
    return prisma.noticia.findMany({
      where: {
        id: { not: currentId },
        ...(categoriaId ? { categoriaId } : {}),
      },
      include: { categoria: true },
      orderBy: { publicada_en: "desc" },
      take: limit,
    });
  }

  static async findAllSlugsForSitemap() {
    return prisma.noticia.findMany({
      select: { slug: true, publicada_en: true },
      orderBy: { publicada_en: "desc" },
    });
  }

  static async update(id: string, data: Parameters<typeof prisma.noticia.update>[0]["data"]) {
    return prisma.noticia.update({ where: { id }, data });
  }
}
