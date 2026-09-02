"use server";

import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { getResend, canSendEmails, FROM_EMAIL } from "@/lib/resend";
import { EMAIL_INSTITUCIONAL } from "@/lib/site";
import { requireAdmin } from "@/utils/supabase/require-admin";
import { construirUrlAbsoluta } from "@/lib/site";
import { normalizarEspecialidadesSolicitud, esIdGenerado } from "@/lib/especialidades";

/**
 * Traduce las especialidades declaradas en `Solicitud.datos` al payload de relación
 * de Prisma. Acepta el formato nuevo (`especialidades: string[]`) y el viejo
 * (`especialidad: string`), y resuelve cada valor contra la tabla por ID o por nombre.
 *
 * Antes esto hacía `connectOrCreate` por `nombre` con el ID que mandaba el formulario:
 * cada aprobación creaba una Especialidad llamada como un cuid y la dejaba visible en
 * el select público. Por eso los valores sin resolver que parecen IDs generados se
 * descartan en vez de crearse — sólo un nombre real puede dar de alta una especialidad.
 *
 * Usa `connect` (aditivo) y nunca `set`: al vincular una solicitud con un profesional
 * que ya está en el padrón, sus especialidades actuales se conservan.
 */
async function resolverEspecialidades(datos: unknown) {
  const valores = normalizarEspecialidadesSolicitud(datos);
  if (valores.length === 0) return undefined;

  const existentes = await prisma.especialidad.findMany({
    where: { OR: [{ id: { in: valores } }, { nombre: { in: valores } }] },
    select: { id: true, nombre: true },
  });

  const idPorValor = new Map<string, string>();
  for (const especialidad of existentes) {
    idPorValor.set(especialidad.id, especialidad.id);
    idPorValor.set(especialidad.nombre, especialidad.id);
  }

  const ids = [...new Set(valores.flatMap((valor) => idPorValor.get(valor) ?? []))];
  const nombresNuevos = valores.filter((valor) => !idPorValor.has(valor) && !esIdGenerado(valor));

  const relacion: {
    connect?: { id: string }[];
    connectOrCreate?: { where: { nombre: string }; create: { nombre: string } }[];
  } = {};

  if (ids.length > 0) relacion.connect = ids.map((id) => ({ id }));
  if (nombresNuevos.length > 0) {
    relacion.connectOrCreate = nombresNuevos.map((nombre) => ({ where: { nombre }, create: { nombre } }));
  }

  return Object.keys(relacion).length > 0 ? relacion : undefined;
}

export async function gestionarSolicitud(id: string, accion: "APROBAR" | "RECHAZAR") {
  await requireAdmin();
  try {
    // Guard de idempotencia. La lista de solicitudes renderizaba los botones
    // para filas ya resueltas, asi que un segundo click reenviaba el mail al
    // profesional — y ocurrio: un solicitante recibio dos veces el correo de
    // rechazo. Esconder el boton no alcanza: las server actions son endpoints
    // publicos y la accion puede llegar desde dos pestañas, dos admins o un
    // reintento de red. La defensa vive aca, en el servidor.
    const solicitud = await prisma.solicitud.findUnique({ where: { id } });

    if (!solicitud) {
      return { success: false, error: "Solicitud no encontrada." };
    }

    if (solicitud.status !== "PENDIENTE") {
      return {
        success: false,
        error: `Esta solicitud ya fue procesada (${solicitud.status}). No se envió ningún correo.`,
      };
    }

    if (accion === "RECHAZAR") {
      await prisma.solicitud.update({
        where: { id },
        data: { status: "RECHAZADA", revisada_en: new Date() },
      });

      if (canSendEmails()) {
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
                  <p>Este es un correo automático, no respondas a esta dirección. Si considerás que hay un error o querés más información, escribinos a <a href="mailto:${EMAIL_INSTITUCIONAL}">${EMAIL_INSTITUCIONAL}</a>.</p>
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
      // 2. Validar duplicados y estado de cuenta
      const emailNormalizado = solicitud.email.toLowerCase();
      const [existeEmail, existeMatricula] = await Promise.all([
        ProfesionalRepository.findByEmail(emailNormalizado),
        ProfesionalRepository.findByMatricula(solicitud.matricula)
      ]);

      if (existeMatricula && existeMatricula.userId) {
        return { success: false, error: `El profesional con matrícula ${solicitud.matricula} ya tiene una cuenta activa vinculada al portal.` };
      }

      if (existeEmail && existeEmail.id !== existeMatricula?.id) {
        return { success: false, error: `El email ${solicitud.email} ya está siendo usado por otro profesional en el sistema.` };
      }

      // 3. Extraer datos del JSON
      const datos = solicitud.datos as any;

      if (!existeMatricula && !datos.localidadId) {
        throw new Error("La solicitud para un nuevo profesional no contiene una Localidad seleccionada.");
      }

      // 4. Invitar al usuario a Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        solicitud.email,
        {
          data: {
            full_name: `${solicitud.nombre} ${solicitud.apellido}`,
          },
          redirectTo: construirUrlAbsoluta("auth/callback?next=/auth/set-password"),
        }
      );

      if (authError) {
        return { success: false, error: `Error al crear identidad en Auth: ${authError.message}` };
      }

      const authUserId = authData.user.id;

      // 5. Vincular profesional existente o crear uno nuevo
      try {
        if (existeMatricula) {
          await prisma.profesional.update({
            where: { id: existeMatricula.id },
            data: {
              userId: authUserId,
              email: emailNormalizado,
              telefono: datos.telefono || existeMatricula.telefono,
              direccion: datos.direccion || existeMatricula.direccion,
              dni: datos.dni || existeMatricula.dni,
              localidadId: datos.localidadId || existeMatricula.localidadId,
              especialidades: await resolverEspecialidades(datos),
            },
          });
        } else {
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
              especialidades: await resolverEspecialidades(datos)
            },
          });
        }
      } catch (dbError: unknown) {
        // La identidad en Supabase Auth ya se creó (paso 4): si no la revertimos acá,
        // queda huérfana y un reintento de "Aprobar" fallará en inviteUserByEmail.
        await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => {});
        const message = dbError instanceof Error ? dbError.message : "error desconocido";
        throw new Error(`No se pudo vincular el profesional en la base de datos: ${message}`);
      }

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
