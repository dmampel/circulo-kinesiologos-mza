"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getObrasSociales() {
  return prisma.obraSocial.findMany({
    orderBy: { orden: "asc" },
  });
}

export async function toggleActiva(id: string, activa: boolean) {
  try {
    await prisma.obraSocial.update({
      where: { id },
      data: { activa },
    });
    revalidatePath("/admin/obras-sociales");
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo cambiar el estado" };
  }
}

export async function deleteObraSocial(id: string) {
  try {
    await prisma.obraSocial.delete({
      where: { id },
    });
    revalidatePath("/admin/obras-sociales");
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo eliminar la obra social" };
  }
}

export async function saveObraSocial(data: { id?: string; nombre: string; logo_url?: string; convenio_url?: string; activa?: boolean }) {
  try {
    if (data.id) {
      await prisma.obraSocial.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          logo_url: data.logo_url || null,
          convenio_url: data.convenio_url || null,
          activa: data.activa ?? true,
        },
      });
    } else {
      // Find max orden to append at the end
      const maxOrdenObra = await prisma.obraSocial.findFirst({
        orderBy: { orden: "desc" },
        select: { orden: true },
      });
      const newOrden = (maxOrdenObra?.orden ?? -1) + 1;

      await prisma.obraSocial.create({
        data: {
          nombre: data.nombre,
          logo_url: data.logo_url || null,
          convenio_url: data.convenio_url || null,
          activa: data.activa ?? true,
          orden: newOrden,
        },
      });
    }
    revalidatePath("/admin/obras-sociales");
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo guardar la obra social" };
  }
}

export async function updateOrden(items: { id: string; orden: number }[]) {
  try {
    // We update all items in a transaction
    await prisma.$transaction(
      items.map((item) =>
        prisma.obraSocial.update({
          where: { id: item.id },
          data: { orden: item.orden },
        })
      )
    );
    revalidatePath("/admin/obras-sociales");
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo actualizar el orden" };
  }
}
