import prisma from "@/lib/prisma";
import { Circular } from "@prisma/client";

export class CircularRepository {
  static async getAll() {
    return prisma.circular.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async getPublishedLatest(limit: number = 3) {
    return prisma.circular.findMany({
      where: { publicada: true },
      orderBy: { publicada_en: "desc" },
      take: limit,
    });
  }

  static async getAllPublished() {
    return prisma.circular.findMany({
      where: { publicada: true },
      orderBy: { publicada_en: "desc" },
    });
  }

  static async getPublishedById(id: string) {
    return prisma.circular.findFirst({
      where: { id, publicada: true },
    });
  }

  static async getById(id: string) {
    return prisma.circular.findUnique({
      where: { id },
    });
  }

  static async create(data: Omit<Circular, "id" | "createdAt" | "updatedAt">) {
    return prisma.circular.create({
      data,
    });
  }

  static async update(id: string, data: Partial<Omit<Circular, "id" | "createdAt" | "updatedAt">>) {
    return prisma.circular.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.circular.delete({
      where: { id },
    });
  }
}
