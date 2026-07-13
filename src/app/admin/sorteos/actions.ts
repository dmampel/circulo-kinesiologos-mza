"use server";

import { z } from "zod";
import { SorteoSchema, SorteoFormState } from "./schema";
import { SorteoRepository } from "@/lib/repositories/SorteoRepository";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/utils/supabase/require-admin";
import { EstadoSorteo } from "@prisma/client";

export async function createSorteo(
  _prevState: SorteoFormState,
  formData: FormData
): Promise<SorteoFormState> {
  await requireAdmin();

  const imagenRaw = formData.get("imagen_url") as string;
  const fechaCierreRaw = formData.get("fechaCierre") as string;
  const maxRaw = formData.get("maxParticipantes") as string;

  const parsed = SorteoSchema.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    imagen_url: imagenRaw || undefined,
    fechaInicio: formData.get("fechaInicio"),
    fechaCierre: fechaCierreRaw || undefined,
    maxParticipantes: maxRaw || undefined,
  });

  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { imagen_url, ...rest } = parsed.data;
  await SorteoRepository.create({ ...rest, ...(imagen_url ? { imagen_url } : {}) });

  revalidatePath("/admin/sorteos");
  redirect("/admin/sorteos");
}

export async function updateSorteo(
  id: string,
  _prevState: SorteoFormState,
  formData: FormData
): Promise<SorteoFormState> {
  await requireAdmin();

  const imagenRaw = formData.get("imagen_url") as string;
  const fechaCierreRaw = formData.get("fechaCierre") as string;
  const maxRaw = formData.get("maxParticipantes") as string;

  const parsed = SorteoSchema.partial().safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    imagen_url: imagenRaw || undefined,
    fechaInicio: formData.get("fechaInicio"),
    fechaCierre: fechaCierreRaw || undefined,
    maxParticipantes: maxRaw || undefined,
  });

  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  await SorteoRepository.update(id, parsed.data);
  revalidatePath("/admin/sorteos");
  redirect("/admin/sorteos");
}

export async function toggleEstadoSorteo(id: string, estado: EstadoSorteo) {
  await requireAdmin();
  await SorteoRepository.toggleEstado(id, estado);
  revalidatePath("/admin/sorteos");
  revalidatePath(`/admin/sorteos/${id}`);
}

export async function realizarSorteoAction(sorteoId: string) {
  await requireAdmin();
  await SorteoRepository.realizarSorteo(sorteoId);
  revalidatePath(`/admin/sorteos/${sorteoId}`);
  revalidatePath("/admin/sorteos");
}
