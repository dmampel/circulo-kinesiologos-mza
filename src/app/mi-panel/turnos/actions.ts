"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { TurnoRepository } from "@/lib/repositories/TurnoRepository";
import { EstadoTurno } from "@prisma/client";

type ActionResult = { success: true } | { success: false; error: string };
type ActionResultWithWarning = { success: true; warning?: string } | { success: false; error: string };

async function getProfesionalId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  return profesional.id;
}

export async function crearTurno(formData: FormData): Promise<ActionResultWithWarning> {
  try {
    const profesionalId = await getProfesionalId();

    const pacienteId = formData.get("pacienteId") as string;
    const fechaStr = formData.get("fecha") as string;
    const horaStr = formData.get("hora") as string;
    const duracion = parseInt(formData.get("duracion") as string) || 50;

    if (!pacienteId || !fechaStr || !horaStr) {
      return { success: false, error: "Paciente, fecha y hora son obligatorios." };
    }

    const fecha = new Date(`${fechaStr}T${horaStr}:00`);
    if (isNaN(fecha.getTime())) {
      return { success: false, error: "Fecha u hora inválidas." };
    }

    const hayConflicto = await TurnoRepository.detectarSolapamiento(profesionalId, fecha, duracion);

    await TurnoRepository.create({
      profesionalId,
      pacienteId,
      fecha,
      duracion,
      motivo: (formData.get("motivo") as string) || undefined,
      notas: (formData.get("notas") as string) || undefined,
    });

    revalidatePath("/mi-panel/turnos");
    revalidatePath("/mi-panel");

    return {
      success: true,
      ...(hayConflicto ? { warning: "El turno se creó pero se detectó un solapamiento de horario." } : {}),
    };
  } catch {
    return { success: false, error: "No se pudo crear el turno. Intentá de nuevo." };
  }
}

export async function actualizarTurno(id: string, formData: FormData): Promise<ActionResultWithWarning> {
  try {
    const profesionalId = await getProfesionalId();

    const fechaStr = formData.get("fecha") as string;
    const horaStr = formData.get("hora") as string;
    const duracion = parseInt(formData.get("duracion") as string) || 50;

    if (!fechaStr || !horaStr) {
      return { success: false, error: "Fecha y hora son obligatorias." };
    }

    const fecha = new Date(`${fechaStr}T${horaStr}:00`);
    if (isNaN(fecha.getTime())) {
      return { success: false, error: "Fecha u hora inválidas." };
    }

    const hayConflicto = await TurnoRepository.detectarSolapamiento(profesionalId, fecha, duracion, id);

    const result = await TurnoRepository.update(id, profesionalId, {
      fecha,
      duracion,
      pacienteId: formData.get("pacienteId") as string || undefined,
      motivo: (formData.get("motivo") as string) || undefined,
      notas: (formData.get("notas") as string) || undefined,
    });

    if (!result) return { success: false, error: "Turno no encontrado." };

    revalidatePath("/mi-panel/turnos");
    revalidatePath("/mi-panel");

    return {
      success: true,
      ...(hayConflicto ? { warning: "El turno se guardó pero se detectó un solapamiento de horario." } : {}),
    };
  } catch {
    return { success: false, error: "No se pudo actualizar el turno. Intentá de nuevo." };
  }
}

export async function cambiarEstadoTurno(id: string, estado: EstadoTurno): Promise<ActionResult> {
  try {
    const profesionalId = await getProfesionalId();
    const result = await TurnoRepository.cambiarEstado(id, profesionalId, estado);
    if (!result) return { success: false, error: "Turno no encontrado." };

    revalidatePath("/mi-panel/turnos");
    revalidatePath("/mi-panel");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo cambiar el estado. Intentá de nuevo." };
  }
}

export async function eliminarTurno(id: string): Promise<ActionResult> {
  try {
    const profesionalId = await getProfesionalId();
    const result = await TurnoRepository.delete(id, profesionalId);
    if (!result) return { success: false, error: "Turno no encontrado." };

    revalidatePath("/mi-panel/turnos");
    revalidatePath("/mi-panel");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar el turno. Intentá de nuevo." };
  }
}
