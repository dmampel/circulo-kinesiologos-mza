"use server";

import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";

export async function gestionarSolicitud(id: string, accion: "APROBAR" | "RECHAZAR") {
  try {
    if (accion === "RECHAZAR") {
      await prisma.solicitud.update({
        where: { id },
        data: { status: "RECHAZADA", revisada_en: new Date() },
      });
      return { success: true };
    } else {
      // 1. Obtener datos de la solicitud
      const solicitud = await prisma.solicitud.findUnique({
        where: { id },
      });

      if (!solicitud) throw new Error("Solicitud no encontrada");

      // 2. Validar duplicados antes de cualquier acción externa
      const emailNormalizado = solicitud.email.toLowerCase();
      const [existeEmail, existeMatricula] = await Promise.all([
        ProfesionalRepository.findByEmail(emailNormalizado),
        ProfesionalRepository.findByMatricula(solicitud.matricula)
      ]);

      if (existeEmail) {
        return { success: false, error: `Ya existe un profesional registrado con el email ${solicitud.email}` };
      }

      if (existeMatricula) {
        return { success: false, error: `Ya existe un profesional registrado con la matrícula ${solicitud.matricula}` };
      }

      // 3. Extraer datos del JSON
      const datos = solicitud.datos as any;

      if (!datos.localidadId) {
        throw new Error("La solicitud no contiene una Localidad seleccionada.");
      }

      // 4. Invitar al usuario a Supabase Auth
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
        return { success: false, error: `Error al crear identidad en Auth: ${authError.message}` };
      }

      const authUserId = authData.user.id;

      // 5. Crear el Profesional vinculado al Auth ID
      await prisma.profesional.create({
        data: {
          nombre: solicitud.nombre,
          apellido: solicitud.apellido,
          full_name: `${solicitud.nombre} ${solicitud.apellido}`,
          email: emailNormalizado,
          matricula: solicitud.matricula,
          dni: datos.dni,
          telefono: datos.telefono,
          direccion: datos.direccion,
          slug: `${solicitud.apellido}-${solicitud.nombre}-${solicitud.matricula}`.toLowerCase().replace(/ /g, "-"),
          localidadId: datos.localidadId,
          status: "ACTIVO",
          userId: authUserId,
          especialidades: {
            connectOrCreate: {
              where: { nombre: datos.especialidad },
              create: { nombre: datos.especialidad }
            }
          }
        },
      });

      // 6. Marcar solicitud como aprobada
      await prisma.solicitud.update({
        where: { id },
        data: { status: "APROBADA", revisada_en: new Date() },
      });

      return { success: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al procesar la solicitud" };
  } finally {
    revalidatePath("/admin/solicitudes");
    revalidatePath("/profesionales");
  }
}
