"use server";

import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function gestionarSolicitud(id: string, accion: "APROBAR" | "RECHAZAR") {
  try {
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

      if (!datos.localidadId) {
        throw new Error("La solicitud no contiene una Localidad seleccionada. Es posible que sea una solicitud vieja sin este dato.");
      }

      // 3. Invitar al usuario a Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        solicitud.email,
        {
          data: {
            full_name: `${solicitud.nombre} ${solicitud.apellido}`,
          },
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/auth/set-password`,
        }
      );

      if (authError) {
        console.error("Error al invitar usuario a Supabase:", authError);
        throw new Error(`Error al crear identidad en Auth: ${authError.message}`);
      }

      const authUserId = authData.user.id;

      // 4. Crear el Profesional vinculado al Auth ID
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
          localidadId: datos.localidadId,
          status: "ACTIVO",
          userId: authUserId, // Vinculamos con Supabase Auth
          especialidades: {
            connectOrCreate: {
              where: { nombre: datos.especialidad },
              create: { nombre: datos.especialidad }
            }
          }
        },
      });

      // 5. Marcar solicitud como aprobada
      await prisma.solicitud.update({
        where: { id },
        data: { status: "APROBADA", revisada_en: new Date() },
      });
    }
  } catch (error: any) {
    console.error("Error en gestionarSolicitud:", error);
    throw new Error(error.message || "Error al procesar la solicitud");
  } finally {
    revalidatePath("/admin/solicitudes");
    revalidatePath("/profesionales");
  }
}
