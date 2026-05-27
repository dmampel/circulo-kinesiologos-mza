"use server";

import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { getResend, canSendEmails, FROM_EMAIL } from "@/lib/resend";

export async function gestionarSolicitud(id: string, accion: "APROBAR" | "RECHAZAR") {
  try {
    if (accion === "RECHAZAR") {
      const solicitud = await prisma.solicitud.findUnique({ where: { id } });

      await prisma.solicitud.update({
        where: { id },
        data: { status: "RECHAZADA", revisada_en: new Date() },
      });

      if (solicitud && canSendEmails()) {
        const resend = getResend();
        try {
          await resend.emails.send({
            from: `Círculo Kinesiólogos <${FROM_EMAIL}>`,
            to: [solicitud.email],
            subject: `Actualización sobre tu solicitud de asociación`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                <div style="background: #0f172a; padding: 20px; color: white; text-align: center;">
                  <h1 style="margin: 0;">Círculo de Kinesiólogos</h1>
                </div>
                <div style="padding: 30px;">
                  <p>Hola <strong>${solicitud.nombre}</strong>,</p>
                  <p>Luego de revisar tu solicitud de asociación, lamentablemente no podemos procesarla en este momento.</p>
                  <p>Si considerás que hay un error o querés más información, podés contactarnos respondiendo este email.</p>
                </div>
                <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                  Este es un mensaje automático del sistema de gestión de Círculo Kinesiólogos.
                </div>
              </div>
            `
          });
        } catch {
          // no bloquear si falla el email de rechazo
        }
      }

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

      // 7. Email de aprobación al profesional
      if (canSendEmails()) {
        const resend = getResend();
        try {
          await resend.emails.send({
            from: `Círculo Kinesiólogos <${FROM_EMAIL}>`,
            to: [solicitud.email],
            subject: `¡Tu solicitud fue aprobada! Bienvenido/a al Círculo`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                <div style="background: #0f172a; padding: 20px; color: white; text-align: center;">
                  <h1 style="margin: 0;">¡Bienvenido/a!</h1>
                </div>
                <div style="padding: 30px;">
                  <p>Hola <strong>${solicitud.nombre}</strong>,</p>
                  <p>Tu solicitud de asociación al Círculo de Kinesiólogos de Mendoza fue <strong>aprobada</strong>. ¡Es un placer tenerte como parte de nuestra institución!</p>
                  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                  <p>En breve recibirás un email separado con el enlace para configurar tu contraseña y acceder a tu portal de socio.</p>
                  <p>Si no lo recibís en los próximos minutos, revisá tu carpeta de spam.</p>
                </div>
                <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                  Este es un mensaje automático del sistema de gestión de Círculo Kinesiólogos.
                </div>
              </div>
            `
          });
        } catch {
          // no bloquear si falla el email de aprobación
        }
      }

      return { success: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al procesar la solicitud" };
  } finally {
    revalidatePath("/admin/solicitudes");
    revalidatePath("/profesionales");
  }
}
