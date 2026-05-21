"use server";

import { AutoridadRepository } from "@/lib/repositories/AutoridadRepository";
import { revalidatePath, refresh } from "next/cache";
import { redirect } from "next/navigation";

export async function crearAutoridad(formData: FormData) {
  try {
    const profesionalId = formData.get("profesionalId") as string;
    const cargo = formData.get("cargo") as string;
    const orden = parseInt(formData.get("orden") as string) || 0;

    await AutoridadRepository.create({ profesionalId, cargo, orden });
  } catch (error: any) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/autoridades");
  revalidatePath("/institucional");
  refresh();
  redirect("/admin/autoridades");
}

export async function actualizarAutoridad(id: string, formData: FormData) {
  try {
    const cargo = formData.get("cargo") as string;
    const orden = parseInt(formData.get("orden") as string) || 0;
    const profesionalId = formData.get("profesionalId") as string;

    await AutoridadRepository.update(id, { 
      cargo, 
      orden,
      profesionalId
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/autoridades");
  revalidatePath("/institucional");
  refresh();
  redirect("/admin/autoridades");
}

export async function eliminarAutoridad(id: string) {
  try {
    await AutoridadRepository.delete(id);
    revalidatePath("/admin/autoridades");
    revalidatePath("/institucional");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function eliminarAutoridadAction(id: string): Promise<void> {
  await eliminarAutoridad(id);
}

export async function buscarProfesionales(query: string) {
  try {
    const { ProfesionalRepository } = await import("@/lib/repositories/ProfesionalRepository");
    const result = await ProfesionalRepository.findPaginated(1, 10, { query });
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
