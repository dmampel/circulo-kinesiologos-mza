"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { InscripcionSorteoRepository } from "@/lib/repositories/InscripcionSorteoRepository";

async function getProfesionalId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  return profesional.id;
}

export async function inscribirmeAlSorteo(sorteoId: string) {
  const profesionalId = await getProfesionalId();
  await InscripcionSorteoRepository.inscribir(sorteoId, profesionalId);
  revalidatePath("/mi-panel/sorteos");
}

export async function desinscribirmeDelSorteo(sorteoId: string) {
  const profesionalId = await getProfesionalId();
  await InscripcionSorteoRepository.desinscribir(sorteoId, profesionalId);
  revalidatePath("/mi-panel/sorteos");
}
