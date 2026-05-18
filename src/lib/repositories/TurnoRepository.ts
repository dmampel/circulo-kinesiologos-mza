import prisma from "@/lib/prisma";
import { EstadoTurno } from "@prisma/client";

export interface CreateTurnoData {
  fecha: Date;
  duracion?: number;
  motivo?: string;
  notas?: string;
  profesionalId: string;
  pacienteId: string;
}

export interface UpdateTurnoData {
  fecha?: Date;
  duracion?: number;
  motivo?: string;
  notas?: string;
  pacienteId?: string;
}

export class TurnoRepository {
  static async getByProfesionalAndWeek(profesionalId: string, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return prisma.turno.findMany({
      where: {
        profesionalId,
        fecha: { gte: weekStart, lt: weekEnd },
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fecha: "asc" },
    });
  }

  static async getTodayByProfesional(profesionalId: string) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    return prisma.turno.findMany({
      where: {
        profesionalId,
        fecha: { gte: todayStart, lte: todayEnd },
        estado: { not: EstadoTurno.CANCELADO },
      },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fecha: "asc" },
    });
  }

  static async findById(id: string, profesionalId: string) {
    return prisma.turno.findFirst({
      where: { id, profesionalId },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
      },
    });
  }

  static async create(data: CreateTurnoData) {
    return prisma.turno.create({
      data: { ...data, duracion: data.duracion ?? 50 },
    });
  }

  static async update(id: string, profesionalId: string, data: UpdateTurnoData) {
    const existing = await prisma.turno.findFirst({ where: { id, profesionalId } });
    if (!existing) return null;
    return prisma.turno.update({ where: { id }, data });
  }

  static async cambiarEstado(id: string, profesionalId: string, estado: EstadoTurno) {
    const existing = await prisma.turno.findFirst({ where: { id, profesionalId } });
    if (!existing) return null;
    return prisma.turno.update({ where: { id }, data: { estado } });
  }

  static async delete(id: string, profesionalId: string) {
    const existing = await prisma.turno.findFirst({ where: { id, profesionalId } });
    if (!existing) return null;
    return prisma.turno.delete({ where: { id } });
  }

  static async detectarSolapamiento(
    profesionalId: string,
    fecha: Date,
    duracion: number,
    excludeId?: string
  ): Promise<boolean> {
    const dayStart = new Date(fecha);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(fecha);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const turnosDelDia = await prisma.turno.findMany({
      where: {
        profesionalId,
        estado: { not: EstadoTurno.CANCELADO },
        fecha: { gte: dayStart, lte: dayEnd },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    const nuevaFin = new Date(fecha.getTime() + duracion * 60 * 1000);
    return turnosDelDia.some((t) => {
      const tFin = new Date(t.fecha.getTime() + t.duracion * 60 * 1000);
      return fecha < tFin && nuevaFin > t.fecha;
    });
  }
}
