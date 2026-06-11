"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";

async function getProfesionalId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  return profesional.id;
}

export async function inscribirseACapacitacion(capacitacionId: string) {
  const profesionalId = await getProfesionalId();
  await CapacitacionRepository.inscribir(profesionalId, capacitacionId);
  revalidatePath("/mi-panel/capacitaciones", "layout");
}

export async function cancelarInscripcionSocio(inscripcionId: string) {
  const profesionalId = await getProfesionalId();
  await CapacitacionRepository.cancelarInscripcion(inscripcionId, profesionalId);
  revalidatePath("/mi-panel/capacitaciones", "layout");
}
