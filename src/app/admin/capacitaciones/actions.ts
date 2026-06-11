"use server";

import { z } from "zod";
import { CapacitacionSchema, CapacitacionFormState } from "./schema";
import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/utils/supabase/require-admin";

export async function createCapacitacion(
  _prevState: CapacitacionFormState,
  formData: FormData
): Promise<CapacitacionFormState> {
  await requireAdmin();
  const fechaFinRaw = formData.get("fechaFin") as string;

  const parsed = CapacitacionSchema.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    tipo: formData.get("tipo"),
    modalidad: formData.get("modalidad"),
    fechaInicio: formData.get("fechaInicio"),
    fechaFin: fechaFinRaw || undefined,
    ubicacion: formData.get("ubicacion") || undefined,
    cupoMaximo: formData.get("cupoMaximo") || undefined,
    costo: formData.get("costo") || undefined,
    publicada: formData.get("publicada") === "on",
  });

  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  await CapacitacionRepository.create(parsed.data);
  revalidatePath("/admin/capacitaciones");
  redirect("/admin/capacitaciones");
}

export async function updateCapacitacion(
  id: string,
  _prevState: CapacitacionFormState,
  formData: FormData
): Promise<CapacitacionFormState> {
  await requireAdmin();
  const fechaFinRaw = formData.get("fechaFin") as string;

  const parsed = CapacitacionSchema.partial().safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    tipo: formData.get("tipo"),
    modalidad: formData.get("modalidad"),
    fechaInicio: formData.get("fechaInicio"),
    fechaFin: fechaFinRaw || undefined,
    ubicacion: formData.get("ubicacion") || undefined,
    cupoMaximo: formData.get("cupoMaximo") || undefined,
    costo: formData.get("costo") || undefined,
    publicada: formData.get("publicada") === "on",
  });

  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  await CapacitacionRepository.update(id, parsed.data);
  revalidatePath("/admin/capacitaciones");
  redirect("/admin/capacitaciones");
}

export async function cambiarEstadoInscripcion(
  id: string,
  nuevoEstado: "PENDIENTE" | "CONFIRMADA" | "CANCELADA"
) {
  await requireAdmin();
  await CapacitacionRepository.actualizarEstadoInscripcion(id, nuevoEstado);
  revalidatePath("/admin/capacitaciones/[id]", "page");
}
