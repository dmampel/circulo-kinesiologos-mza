"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/supabase/require-admin";

export async function crearCategoria(formData: FormData) {
  await requireAdmin();
  try {
    const nombre = formData.get("nombre") as string;
    const icono = formData.get("icono") as string || "Tag";
    const color = formData.get("color") as string || "blue";

    const slug = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    await prisma.categoriaBeneficio.create({
      data: {
        nombre,
        slug,
        icono,
        color,
      },
    });

    revalidatePath("/admin/beneficios");
    revalidatePath("/kineclub");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function actualizarCategoria(id: string, formData: FormData) {
  await requireAdmin();
  try {
    const nombre = formData.get("nombre") as string;
    const icono = formData.get("icono") as string;
    const color = formData.get("color") as string;

    const slug = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    await prisma.categoriaBeneficio.update({
      where: { id },
      data: {
        nombre,
        slug,
        icono,
        color,
      },
    });

    revalidatePath("/admin/beneficios");
    revalidatePath("/kineclub");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function eliminarCategoria(id: string) {
  await requireAdmin();
  try {
    const beneficiosCount = await prisma.beneficioKineClub.count({
      where: { categoriaId: id }
    });

    if (beneficiosCount > 0) {
      throw new Error("No se puede eliminar una categoría con beneficios asociados.");
    }

    await prisma.categoriaBeneficio.delete({
      where: { id },
    });

    revalidatePath("/admin/beneficios");
    revalidatePath("/kineclub");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
