import prisma from "@/lib/prisma";

function toSlug(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export class CategoriaNoticiaRepository {
  static async getAll() {
    return prisma.categoriaNoticia.findMany({
      include: {
        _count: {
          select: { noticias: true }
        }
      },
      orderBy: {
        nombre: "asc",
      },
    });
  }

  static async getBySlug(slug: string) {
    return prisma.categoriaNoticia.findUnique({
      where: { slug },
    });
  }

  static async getById(id: string) {
    return prisma.categoriaNoticia.findUnique({
      where: { id },
    });
  }

  static async create(data: { nombre: string; icono?: string; color?: string }) {
    return prisma.categoriaNoticia.create({
      data: {
        nombre: data.nombre,
        slug: toSlug(data.nombre),
        icono: data.icono ?? "Tag",
        color: data.color ?? "blue",
      },
    });
  }

  static async update(id: string, data: { nombre: string; icono?: string; color?: string }) {
    return prisma.categoriaNoticia.update({
      where: { id },
      data: {
        nombre: data.nombre,
        slug: toSlug(data.nombre),
        icono: data.icono,
        color: data.color,
      },
    });
  }

  static async delete(id: string) {
    const count = await prisma.noticia.count({ where: { categoriaId: id } });
    if (count > 0) {
      throw new Error("No se puede eliminar una categoría con noticias asociadas.");
    }
    return prisma.categoriaNoticia.delete({ where: { id } });
  }
}
