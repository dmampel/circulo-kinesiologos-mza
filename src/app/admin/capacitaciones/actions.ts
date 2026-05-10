"use server";

import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TipoCapacitacion, ModalidadCapacitacion } from "@prisma/client";

export async function createCapacitacion(formData: FormData) {
  const data = {
    titulo: formData.get("titulo") as string,
    descripcion: formData.get("descripcion") as string,
    tipo: formData.get("tipo") as TipoCapacitacion,
    modalidad: formData.get("modalidad") as ModalidadCapacitacion,
    fechaInicio: new Date(formData.get("fechaInicio") as string),
    fechaFin: formData.get("fechaFin") ? new Date(formData.get("fechaFin") as string) : undefined,
    ubicacion: (formData.get("ubicacion") as string) || undefined,
    cupoMaximo: formData.get("cupoMaximo") ? parseInt(formData.get("cupoMaximo") as string) : undefined,
    costo: formData.get("costo") ? parseFloat(formData.get("costo") as string) : undefined,
    publicada: formData.get("publicada") === "on",
  };

  await CapacitacionRepository.create(data);

  revalidatePath("/admin/capacitaciones");
  redirect("/admin/capacitaciones");
}

export async function cambiarEstadoInscripcion(id: string, nuevoEstado: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "ASISTIO") {
  await CapacitacionRepository.actualizarEstadoInscripcion(id, nuevoEstado);
  revalidatePath("/admin/capacitaciones/[id]", "page");
}
