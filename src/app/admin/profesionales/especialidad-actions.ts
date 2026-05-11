"use server";

import { EspecialidadRepository } from "@/lib/repositories/EspecialidadRepository";
import { revalidatePath } from "next/cache";

export async function crearEspecialidad(formData: FormData) {
  try {
    const nombre = (formData.get("nombre") as string).trim();
    if (!nombre) throw new Error("El nombre es obligatorio.");
    await EspecialidadRepository.create(nombre);
    revalidatePath("/admin/profesionales");
    revalidatePath("/profesionales");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function actualizarEspecialidad(id: string, formData: FormData) {
  try {
    const nombre = (formData.get("nombre") as string).trim();
    if (!nombre) throw new Error("El nombre es obligatorio.");
    await EspecialidadRepository.update(id, nombre);
    revalidatePath("/admin/profesionales");
    revalidatePath("/profesionales");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function eliminarEspecialidad(id: string) {
  try {
    const count = await EspecialidadRepository.countProfesionales(id);
    if (count > 0) {
      throw new Error(`No se puede eliminar: hay ${count} profesional${count > 1 ? "es" : ""} con esta especialidad.`);
    }
    await EspecialidadRepository.deleteById(id);
    revalidatePath("/admin/profesionales");
    revalidatePath("/profesionales");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
