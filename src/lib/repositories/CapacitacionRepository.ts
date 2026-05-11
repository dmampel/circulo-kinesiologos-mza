import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class CapacitacionRepository {
  // admin
  static async findAll() {
    return prisma.capacitacion.findMany({
      orderBy: { fechaInicio: "desc" },
      include: {
        _count: {
          select: { inscripciones: true },
        },
      },
    });
  }

  static async findById(id: string) {
    return prisma.capacitacion.findUnique({
      where: { id },
      include: {
        inscripciones: {
          include: {
            profesional: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async create(data: Prisma.CapacitacionCreateInput) {
    return prisma.capacitacion.create({ data });
  }

  static async update(id: string, data: Prisma.CapacitacionUpdateInput) {
    return prisma.capacitacion.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.capacitacion.delete({ where: { id } });
  }

  // socio
  static async findPublicadas() {
    return prisma.capacitacion.findMany({
      where: { publicada: true },
      orderBy: { fechaInicio: "asc" },
      include: {
        _count: {
          select: { inscripciones: { where: { estado: { not: "CANCELADA" } } } },
        },
      },
    });
  }

  static async getInscripcionesSocio(profesionalId: string) {
    return prisma.inscripcionCapacitacion.findMany({
      where: { profesionalId },
      include: {
        capacitacion: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getProximasInscripcionesSocio(profesionalId: string) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return prisma.inscripcionCapacitacion.findMany({
      where: {
        profesionalId,
        estado: { not: "CANCELADA" },
        capacitacion: {
          fechaInicio: { gte: hoy },
          publicada: true,
        },
      },
      include: {
        capacitacion: true,
      },
      orderBy: { capacitacion: { fechaInicio: "asc" } },
      take: 15,
    });
  }

  static async inscribir(profesionalId: string, capacitacionId: string) {
    return prisma.$transaction(async (tx) => {
      const capacitacion = await tx.capacitacion.findUnique({
        where: { id: capacitacionId },
        include: {
          _count: {
            select: { inscripciones: { where: { estado: { not: "CANCELADA" } } } },
          },
        },
      });

      if (!capacitacion) throw new Error("Capacitación no encontrada");

      if (
        capacitacion.cupoMaximo &&
        capacitacion._count.inscripciones >= capacitacion.cupoMaximo
      ) {
        throw new Error("Cupo agotado");
      }

      return tx.inscripcionCapacitacion.upsert({
        where: {
          capacitacionId_profesionalId: {
            capacitacionId,
            profesionalId,
          },
        },
        update: {
          estado: "PENDIENTE",
        },
        create: {
          profesional: { connect: { id: profesionalId } },
          capacitacion: { connect: { id: capacitacionId } },
          estado: "PENDIENTE",
        },
      });
    });
  }

  static async cancelarInscripcion(id: string, profesionalId: string) {
    // Verificamos que la inscripción sea del profesional
    return prisma.inscripcionCapacitacion.update({
      where: {
        id,
        profesionalId,
      },
      data: { estado: "CANCELADA" },
    });
  }

  static async actualizarEstadoInscripcion(id: string, estado: "PENDIENTE" | "CONFIRMADA" | "CANCELADA") {
    return prisma.inscripcionCapacitacion.update({
      where: { id },
      data: { estado },
    });
  }

  static async findPublicadaById(id: string) {
    return prisma.capacitacion.findFirst({
      where: { id, publicada: true },
      include: {
        _count: {
          select: { inscripciones: { where: { estado: { not: "CANCELADA" } } } },
        },
      },
    });
  }

  static async getInscripcionSocio(profesionalId: string, capacitacionId: string) {
    return prisma.inscripcionCapacitacion.findFirst({
      where: { profesionalId, capacitacionId, estado: { not: "CANCELADA" } },
    });
  }
}
