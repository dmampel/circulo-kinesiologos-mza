import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Filtro de /kineclub: casi-estático, invalidado por tag "categorias-beneficios"
// desde las Server Actions de admin que crean/editan/borran categorías de beneficios.
const getCachedCategoriasBeneficio = unstable_cache(
  async () =>
    prisma.categoriaBeneficio.findMany({
      orderBy: {
        nombre: "asc",
      },
    }),
  ["categorias-beneficio-all"],
  { tags: ["categorias-beneficios"], revalidate: 3600 },
);

export class CategoriaRepository {
  static async getAll() {
    return getCachedCategoriasBeneficio();
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
