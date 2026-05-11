import prisma from "@/lib/prisma";

export class EspecialidadRepository {
  static async getAll() {
    return prisma.especialidad.findMany({
      where: { nombre: { not: "UBICACIÓN" } },
      orderBy: { nombre: "asc" },
    });
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
