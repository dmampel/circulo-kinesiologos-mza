import prisma from "@/lib/prisma";
import { Prisma, EstadoSorteo } from "@prisma/client";

export class SorteoRepository {
  static async findAll() {
    return prisma.sorteo.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { inscripciones: true } },
        ganador: { select: { id: true, nombre: true, apellido: true, matricula: true } },
      },
    });
  }

  static async findById(id: string) {
    return prisma.sorteo.findUnique({
      where: { id },
      include: {
        inscripciones: {
          include: { profesional: true },
          orderBy: { createdAt: "asc" },
        },
        ganador: { select: { id: true, nombre: true, apellido: true, matricula: true } },
      },
    });
  }

  static async create(data: Prisma.SorteoCreateInput) {
    return prisma.sorteo.create({ data });
  }

  static async update(id: string, data: Prisma.SorteoUpdateInput) {
    return prisma.sorteo.update({ where: { id }, data });
  }

  static async toggleEstado(id: string, estado: EstadoSorteo) {
    return prisma.sorteo.update({ where: { id }, data: { estado } });
  }

  static async realizarSorteo(id: string) {
    const inscripciones = await prisma.inscripcionSorteo.findMany({ where: { sorteoId: id } });
    if (!inscripciones.length) throw new Error("Sin inscriptos");
    const ganador = inscripciones[Math.floor(Math.random() * inscripciones.length)];
    return prisma.sorteo.update({
      where: { id },
      data: { estado: "REALIZADO", ganadorId: ganador.profesionalId },
    });
  }

  static async findForSocios() {
    return prisma.sorteo.findMany({
      where: { estado: { in: ["ACTIVO", "REALIZADO"] } },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { inscripciones: true } },
        ganador: { select: { id: true, nombre: true, apellido: true, matricula: true } },
      },
    });
  }
}
