import prisma from "@/lib/prisma";

export interface CreateEntradaData {
  motivo?: string;
  evolucion: string;
  fecha?: Date;
  pacienteId: string;
}

export interface UpdateEntradaData {
  motivo?: string;
  evolucion?: string;
  fecha?: Date;
}

export class HistoriaClinicaRepository {
  static async findAllByPaciente(pacienteId: string) {
    return prisma.entradaHistoriaClinica.findMany({
      where: { pacienteId },
      orderBy: { fecha: "desc" },
    });
  }

  static async findById(id: string, pacienteId: string) {
    return prisma.entradaHistoriaClinica.findFirst({
      where: { id, pacienteId },
    });
  }

  static async create(data: CreateEntradaData) {
    return prisma.entradaHistoriaClinica.create({ data });
  }

  static async update(id: string, pacienteId: string, data: UpdateEntradaData) {
    const existing = await prisma.entradaHistoriaClinica.findFirst({
      where: { id, pacienteId },
    });
    if (!existing) return null;
    return prisma.entradaHistoriaClinica.update({ where: { id }, data });
  }

  static async delete(id: string, pacienteId: string) {
    const existing = await prisma.entradaHistoriaClinica.findFirst({
      where: { id, pacienteId },
    });
    if (!existing) return null;
    return prisma.entradaHistoriaClinica.delete({ where: { id } });
  }
}
