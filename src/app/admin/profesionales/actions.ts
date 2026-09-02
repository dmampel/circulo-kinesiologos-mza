"use server";

import { Prisma, Status } from "@prisma/client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/supabase/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { construirUrlAbsoluta } from "@/lib/site";
import { getResend, canSendEmails, FROM_EMAIL } from "@/lib/resend";

type ProfesionalInput = {
  id?: string;
  nombre: string;
  apellido: string;
  email?: string;
  matricula: string;
  dni?: string;
  telefono?: string;
  whatsapp?: string;
  direccion?: string;
  horarios?: string;
  foto_url?: string;
  localidadId: string;
  status?: Status;
};

export async function getProfesionales(search?: string, especialidadId?: string, localidadId?: string) {
  const conditions: Prisma.ProfesionalWhereInput[] = [];

  if (search) {
    conditions.push({
      OR: [
        { nombre: { contains: search, mode: "insensitive" as const } },
        { apellido: { contains: search, mode: "insensitive" as const } },
        { matricula: { contains: search, mode: "insensitive" as const } },
      ],
    });
  }

  if (especialidadId) {
    conditions.push({ especialidades: { some: { id: especialidadId } } });
  }

  if (localidadId) {
    conditions.push({ localidadId });
  }

  return prisma.profesional.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    include: { localidad: true, especialidades: true },
    orderBy: { apellido: "asc" },
  });
}

export async function toggleEstadoProfesional(id: string, nuevoEstado: "ACTIVO" | "INACTIVO") {
  await requireAdmin();
  try {
    await prisma.profesional.update({
      where: { id },
      data: { status: nuevoEstado },
    });
    revalidatePath("/admin/profesionales");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo cambiar el estado" };
  }
}

/**
 * Reenvía el link de activación de cuenta a un profesional ya invitado.
 *
 * `inviteUserByEmail` falla con "already registered" contra una identidad que
 * ya existe en Auth, aunque nunca haya confirmado — por eso el reenvío usa
 * `generateLink`, que regenera el token para un usuario invitado pendiente en
 * vez de crear uno nuevo. El link se arma a mano contra `/auth/callback` con
 * `token_hash` + `type`, por el mismo motivo documentado en
 * `auth/callback/route.ts`: el link por defecto de Supabase manda los tokens
 * en el fragmento de la URL, que el servidor nunca llega a ver.
 */
export async function reenviarInvitacion(id: string) {
  await requireAdmin();

  const profesional = await prisma.profesional.findUnique({
    where: { id },
    select: { email: true, nombre: true, apellido: true, full_name: true, userId: true },
  });

  if (!profesional) {
    return { success: false, error: "Profesional no encontrado." };
  }
  if (!profesional.userId) {
    return { success: false, error: "Este profesional todavía no tiene una cuenta invitada." };
  }
  if (!profesional.email) {
    return { success: false, error: "El profesional no tiene un email cargado." };
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email: profesional.email,
    options: {
      data: { full_name: profesional.full_name || `${profesional.nombre} ${profesional.apellido}` },
      redirectTo: construirUrlAbsoluta("auth/callback?next=/auth/set-password"),
    },
  });

  if (error || !data?.properties?.hashed_token) {
    return { success: false, error: `No se pudo generar el link: ${error?.message ?? "error desconocido"}` };
  }

  if (!canSendEmails()) {
    return { success: false, error: "El envío de emails no está configurado." };
  }

  const link = construirUrlAbsoluta(
    `auth/callback?token_hash=${data.properties.hashed_token}&type=invite&next=/auth/set-password`
  );

  const resend = getResend();
  try {
    await resend.emails.send({
      from: `Círculo Kinesiólogos <${FROM_EMAIL}>`,
      to: [profesional.email],
      subject: "Activá tu cuenta en el Círculo de Kinesiólogos",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background: #0f172a; padding: 20px; color: white; text-align: center;">
            <h1 style="margin: 0;">Círculo de Kinesiólogos</h1>
          </div>
          <div style="padding: 30px;">
            <p>Hola <strong>${profesional.nombre}</strong>,</p>
            <p>Te reenviamos el enlace para activar tu cuenta y configurar tu contraseña en el portal de socios.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Activar mi cuenta
              </a>
            </p>
            <p>Si no pediste este correo, podés ignorarlo.</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
            Este es un mensaje automático del sistema de gestión de Círculo Kinesiólogos.
          </div>
        </div>
      `,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error desconocido";
    return { success: false, error: `No se pudo enviar el email: ${message}` };
  }

  return { success: true };
}

export async function getLocalidadesYEspecialidades() {
  const localidades = await prisma.localidad.findMany({ orderBy: { nombre: "asc" } });
  const especialidades = await prisma.especialidad.findMany({ orderBy: { nombre: "asc" } });
  return { localidades, especialidades };
}

export async function saveProfesional(data: ProfesionalInput, especialidadIds: string[]) {
  await requireAdmin();
  try {
    const baseSlug = `${data.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${data.apellido.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    if (data.id) {
      await prisma.profesional.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email || null,
          matricula: data.matricula,
          dni: data.dni || null,
          telefono: data.telefono || null,
          whatsapp: data.whatsapp || null,
          direccion: data.direccion || null,
          horarios: data.horarios || null,
          foto_url: data.foto_url || null,
          localidadId: data.localidadId,
          status: data.status,
          especialidades: {
            set: especialidadIds.map(id => ({ id }))
          }
        },
      });
    } else {
      await prisma.profesional.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          full_name: `${data.nombre} ${data.apellido}`,
          slug: baseSlug + '-' + Date.now().toString().slice(-4),
          email: data.email || null,
          matricula: data.matricula,
          dni: data.dni || null,
          telefono: data.telefono || null,
          whatsapp: data.whatsapp || null,
          direccion: data.direccion || null,
          horarios: data.horarios || null,
          foto_url: data.foto_url || null,
          localidadId: data.localidadId,
          status: data.status ?? Status.ACTIVO,
          especialidades: {
            connect: especialidadIds.map(id => ({ id }))
          }
        },
      });
    }
    revalidatePath("/admin/profesionales");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo guardar la información" };
  }
}
