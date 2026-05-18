import prisma from "@/lib/prisma";

export interface CreatePacienteData {
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  notas?: string;
  profesionalId: string;
}

export interface UpdatePacienteData {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  notas?: string;
}

export class PacienteRepository {
  static async findAll(profesionalId: string) {
    return prisma.paciente.findMany({
      where: { profesionalId },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    });
  }

  static async findById(id: string, profesionalId: string) {
    return prisma.paciente.findFirst({
      where: { id, profesionalId },
    });
  }

  static async create(data: CreatePacienteData) {
    return prisma.paciente.create({ data });
  }

  static async update(id: string, profesionalId: string, data: UpdatePacienteData) {
    const existing = await prisma.paciente.findFirst({ where: { id, profesionalId } });
    if (!existing) return null;
    return prisma.paciente.update({ where: { id }, data });
  }

  static async delete(id: string, profesionalId: string) {
    const existing = await prisma.paciente.findFirst({ where: { id, profesionalId } });
    if (!existing) return null;
    return prisma.paciente.delete({ where: { id } });
  }

  static async hasTurnos(id: string): Promise<boolean> {
    const count = await prisma.turno.count({ where: { pacienteId: id } });
    return count > 0;
  }
}
