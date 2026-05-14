import prisma from "@/lib/prisma";

export interface AutoridadWithProfesional {
  id: string;
  cargo: string;
  orden: number;
  profesionalId: string;
  profesional: {
    nombre: string;
    apellido: string;
    full_name: string | null;
    matricula: string;
    foto_url: string | null;
  };
}

export class AutoridadRepository {
  static async findAll(): Promise<AutoridadWithProfesional[]> {
    return prisma.autoridad.findMany({
      include: {
        profesional: {
          select: {
            nombre: true,
            apellido: true,
            full_name: true,
            matricula: true,
            foto_url: true,
          },
        },
      },
      orderBy: {
        orden: "asc",
      },
    }) as unknown as Promise<AutoridadWithProfesional[]>;
  }

  static async getById(id: string): Promise<AutoridadWithProfesional | null> {
    return prisma.autoridad.findUnique({
      where: { id },
      include: {
        profesional: {
          select: {
            nombre: true,
            apellido: true,
            full_name: true,
            matricula: true,
            foto_url: true,
          },
        },
      },
    }) as unknown as Promise<AutoridadWithProfesional | null>;
  }

  static async create(data: { cargo: string; orden: number; profesionalId: string }) {
    return prisma.autoridad.create({
      data,
    });
  }

  static async update(id: string, data: Partial<{ cargo: string; orden: number; profesionalId: string }>) {
    return prisma.autoridad.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.autoridad.delete({
      where: { id },
    });
  }
}
