import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Filtro de /profesionales: casi-estático, invalidado por tag "especialidades"
// desde las Server Actions de admin que crean/editan/borran especialidades.
const getCachedEspecialidades = unstable_cache(
  async () =>
    prisma.especialidad.findMany({
      where: { nombre: { not: "UBICACIÓN" } },
      orderBy: { nombre: "asc" },
    }),
  ["especialidades-all"],
  { tags: ["especialidades"], revalidate: 3600 },
);

export class EspecialidadRepository {
  static async getAll() {
    return getCachedEspecialidades();
  }

  static async create(nombre: string) {
    return prisma.especialidad.create({ data: { nombre } });
  }

  static async update(id: string, nombre: string) {
    return prisma.especialidad.update({ where: { id }, data: { nombre } });
  }

  static async deleteById(id: string) {
    return prisma.especialidad.delete({ where: { id } });
  }

  static async countProfesionales(id: string) {
    return prisma.profesional.count({ where: { especialidades: { some: { id } } } });
  }
}
