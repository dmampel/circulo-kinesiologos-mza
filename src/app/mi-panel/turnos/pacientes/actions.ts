"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { PacienteRepository } from "@/lib/repositories/PacienteRepository";

type ActionResult = { success: true } | { success: false; error: string };

async function getProfesionalId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  return profesional.id;
}

export async function crearPaciente(formData: FormData): Promise<ActionResult> {
  try {
    const profesionalId = await getProfesionalId();

    const nombre = (formData.get("nombre") as string).trim();
    const apellido = (formData.get("apellido") as string).trim();

    if (!nombre || !apellido) {
      return { success: false, error: "Nombre y apellido son obligatorios." };
    }

    await PacienteRepository.create({
      nombre,
      apellido,
      telefono: (formData.get("telefono") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      notas: (formData.get("notas") as string) || undefined,
      profesionalId,
    });

    revalidatePath("/mi-panel/turnos/pacientes");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo crear el paciente. Intentá de nuevo." };
  }
}

export async function actualizarPaciente(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const profesionalId = await getProfesionalId();

    const nombre = (formData.get("nombre") as string).trim();
    const apellido = (formData.get("apellido") as string).trim();

    if (!nombre || !apellido) {
      return { success: false, error: "Nombre y apellido son obligatorios." };
    }

    const result = await PacienteRepository.update(id, profesionalId, {
      nombre,
      apellido,
      telefono: (formData.get("telefono") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      notas: (formData.get("notas") as string) || undefined,
    });

    if (!result) return { success: false, error: "Paciente no encontrado." };

    revalidatePath("/mi-panel/turnos/pacientes");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo actualizar el paciente. Intentá de nuevo." };
  }
}

export async function eliminarPaciente(id: string): Promise<ActionResult> {
  try {
    const profesionalId = await getProfesionalId();

    const result = await PacienteRepository.delete(id, profesionalId);
    if (!result) return { success: false, error: "Paciente no encontrado." };

    revalidatePath("/mi-panel/turnos/pacientes");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar el paciente. Intentá de nuevo." };
  }
}

export async function checkTieneTurnos(id: string): Promise<boolean> {
  return PacienteRepository.hasTurnos(id);
}
