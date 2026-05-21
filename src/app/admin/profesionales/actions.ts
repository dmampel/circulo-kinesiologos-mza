"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type ProfesionalInput = {
  id?: string;
  nombre: string;
  apellido: string;
  email?: string;
  matricula: string;
  dni?: string;
  telefono?: string;
  whatsapp?: string;
  direccion?: string;
  horarios?: string;
  foto_url?: string;
  localidadId: string;
  status?: string;
};

export async function getProfesionales(search?: string, especialidadId?: string, localidadId?: string) {
  const conditions: Prisma.ProfesionalWhereInput[] = [];

  if (search) {
    conditions.push({
      OR: [
        { nombre: { contains: search, mode: "insensitive" as const } },
        { apellido: { contains: search, mode: "insensitive" as const } },
        { matricula: { contains: search, mode: "insensitive" as const } },
      ],
    });
  }

  if (especialidadId) {
    conditions.push({ especialidades: { some: { id: especialidadId } } });
  }

  if (localidadId) {
    conditions.push({ localidadId });
  }

  return prisma.profesional.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    include: { localidad: true, especialidades: true },
    orderBy: { apellido: "asc" },
  });
}

export async function toggleEstadoProfesional(id: string, nuevoEstado: "ACTIVO" | "INACTIVO") {
  try {
    await prisma.profesional.update({
      where: { id },
      data: { status: nuevoEstado },
    });
    revalidatePath("/admin/profesionales");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo cambiar el estado" };
  }
}

export async function deleteProfesional(id: string) {
  try {
    await prisma.profesional.delete({
      where: { id },
    });
    revalidatePath("/admin/profesionales");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar al profesional" };
  }
}

export async function getLocalidadesYEspecialidades() {
  const localidades = await prisma.localidad.findMany({ orderBy: { nombre: "asc" } });
  const especialidades = await prisma.especialidad.findMany({ orderBy: { nombre: "asc" } });
  return { localidades, especialidades };
}

export async function saveProfesional(data: ProfesionalInput, especialidadIds: string[]) {
  try {
    const baseSlug = `${data.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${data.apellido.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    if (data.id) {
      await prisma.profesional.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email || null,
          matricula: data.matricula,
          dni: data.dni || null,
          telefono: data.telefono || null,
          whatsapp: data.whatsapp || null,
          direccion: data.direccion || null,
          horarios: data.horarios || null,
          foto_url: data.foto_url || null,
          localidadId: data.localidadId,
          status: data.status,
          especialidades: {
            set: especialidadIds.map(id => ({ id }))
          }
        },
      });
    } else {
      await prisma.profesional.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          full_name: `${data.nombre} ${data.apellido}`,
          slug: baseSlug + '-' + Date.now().toString().slice(-4),
          email: data.email || null,
          matricula: data.matricula,
          dni: data.dni || null,
          telefono: data.telefono || null,
          whatsapp: data.whatsapp || null,
          direccion: data.direccion || null,
          horarios: data.horarios || null,
          foto_url: data.foto_url || null,
          localidadId: data.localidadId,
          status: data.status || "ACTIVO",
          especialidades: {
            connect: especialidadIds.map(id => ({ id }))
          }
        },
      });
    }
    revalidatePath("/admin/profesionales");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar la información" };
  }
}
