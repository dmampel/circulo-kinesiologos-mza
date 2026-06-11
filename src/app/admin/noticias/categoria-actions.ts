"use server";

import { revalidatePath } from "next/cache";
import { CategoriaNoticiaRepository } from "@/lib/repositories/CategoriaNoticiaRepository";
import { requireAdmin } from "@/utils/supabase/require-admin";

export async function crearCategoria(formData: FormData) {
  await requireAdmin();
  try {
    const nombre = formData.get("nombre") as string;
    const icono = (formData.get("icono") as string) || "Tag";
    const color = (formData.get("color") as string) || "blue";

    await CategoriaNoticiaRepository.create({ nombre, icono, color });

    revalidatePath("/admin/noticias");
    revalidatePath("/noticias");
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

    await CategoriaNoticiaRepository.update(id, { nombre, icono, color });

    revalidatePath("/admin/noticias");
    revalidatePath("/noticias");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function eliminarCategoria(id: string) {
  await requireAdmin();
  try {
    await CategoriaNoticiaRepository.delete(id);

    revalidatePath("/admin/noticias");
    revalidatePath("/noticias");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
