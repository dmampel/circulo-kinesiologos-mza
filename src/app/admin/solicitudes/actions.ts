"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function gestionarSolicitud(id: string, accion: "APROBAR" | "RECHAZAR") {
  if (accion === "RECHAZAR") {
    await prisma.solicitud.update({
      where: { id },
      data: { status: "RECHAZADA", revisada_en: new Date() },
    });
  } else {
    // 1. Obtener datos de la solicitud
    const solicitud = await prisma.solicitud.findUnique({
      where: { id },
    });

    if (!solicitud) throw new Error("Solicitud no encontrada");

    // 2. Extraer datos del JSON
    const datos = solicitud.datos as any;

    // 3. Crear el Profesional
    await prisma.profesional.create({
      data: {
        nombre: solicitud.nombre,
        apellido: solicitud.apellido,
        full_name: `${solicitud.nombre} ${solicitud.apellido}`,
        email: solicitud.email,
        matricula: solicitud.matricula,
        dni: datos.dni,
        telefono: datos.telefono,
        direccion: datos.direccion,
        slug: `${solicitud.apellido}-${solicitud.nombre}-${solicitud.matricula}`.toLowerCase().replace(/ /g, "-"),
        localidadId: datos.localidadId, // Usamos el ID exacto del registro
        status: "ACTIVO",
        // Opcional: Vincular especialidad si existe
        especialidades: {
          connectOrCreate: {
            where: { nombre: datos.especialidad },
            create: { nombre: datos.especialidad }
          }
        }
      },
    });

    // 4. Marcar solicitud como aprobada
    await prisma.solicitud.update({
      where: { id },
      data: { status: "APROBADA", revisada_en: new Date() },
    });
  }

  revalidatePath("/admin/solicitudes");
  revalidatePath("/profesionales");
}
