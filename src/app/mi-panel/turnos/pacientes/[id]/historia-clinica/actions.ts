"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { PacienteRepository } from "@/lib/repositories/PacienteRepository";
import { HistoriaClinicaRepository } from "@/lib/repositories/HistoriaClinicaRepository";

type ActionResult = { success: true } | { success: false; error: string };

async function getProfesionalId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  return profesional.id;
}

async function verificarPaciente(pacienteId: string, profesionalId: string) {
  const paciente = await PacienteRepository.findById(pacienteId, profesionalId);
  if (!paciente) return null;
  return paciente;
}

export async function crearEntrada(
  pacienteId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const profesionalId = await getProfesionalId();
    const paciente = await verificarPaciente(pacienteId, profesionalId);
    if (!paciente) return { success: false, error: "Paciente no encontrado." };

    const evolucion = (formData.get("evolucion") as string).trim();
    if (!evolucion) {
      return { success: false, error: "La evolución es obligatoria." };
    }

    const fechaRaw = formData.get("fecha") as string;
    const fecha = fechaRaw ? new Date(fechaRaw) : new Date();

    await HistoriaClinicaRepository.create({
      evolucion,
      motivo: (formData.get("motivo") as string) || undefined,
      fecha,
      pacienteId,
    });

    revalidatePath(`/mi-panel/turnos/pacientes/${pacienteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar la entrada. Intentá de nuevo." };
  }
}

export async function actualizarEntrada(
  entradaId: string,
  pacienteId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const profesionalId = await getProfesionalId();
    const paciente = await verificarPaciente(pacienteId, profesionalId);
    if (!paciente) return { success: false, error: "Paciente no encontrado." };

    const evolucion = (formData.get("evolucion") as string).trim();
    if (!evolucion) {
      return { success: false, error: "La evolución es obligatoria." };
    }

    const fechaRaw = formData.get("fecha") as string;
    const fecha = fechaRaw ? new Date(fechaRaw) : undefined;

    const result = await HistoriaClinicaRepository.update(entradaId, pacienteId, {
      evolucion,
      motivo: (formData.get("motivo") as string) || undefined,
      fecha,
    });

    if (!result) return { success: false, error: "Entrada no encontrada." };

    revalidatePath(`/mi-panel/turnos/pacientes/${pacienteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo actualizar la entrada. Intentá de nuevo." };
  }
}

export async function eliminarEntrada(
  entradaId: string,
  pacienteId: string
): Promise<ActionResult> {
  try {
    const profesionalId = await getProfesionalId();
    const paciente = await verificarPaciente(pacienteId, profesionalId);
    if (!paciente) return { success: false, error: "Paciente no encontrado." };

    const result = await HistoriaClinicaRepository.delete(entradaId, pacienteId);
    if (!result) return { success: false, error: "Entrada no encontrada." };

    revalidatePath(`/mi-panel/turnos/pacientes/${pacienteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar la entrada. Intentá de nuevo." };
  }
}
