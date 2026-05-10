"use server";

import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";
import { revalidatePath } from "next/cache";

export async function inscribirseACapacitacion(profesionalId: string, capacitacionId: string) {
  await CapacitacionRepository.inscribir(profesionalId, capacitacionId);
  revalidatePath("/mi-panel/capacitaciones", "layout");
}

export async function cancelarInscripcionSocio(inscripcionId: string, profesionalId: string) {
  await CapacitacionRepository.cancelarInscripcion(inscripcionId, profesionalId);
  revalidatePath("/mi-panel/capacitaciones", "layout");
}
