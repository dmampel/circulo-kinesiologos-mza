"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function getLocalidades() {
  return await prisma.localidad.findMany({
    orderBy: { nombre: "asc" },
  });
}

export async function getEspecialidades() {
  return await prisma.especialidad.findMany({
    where: { nombre: { not: "UBICACIÓN" } },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });
}

export async function crearSolicitud(formData: FormData) {
  // Usamos supabaseAdmin para tener permisos de escritura en Storage sin RLS (Service Role)
  const supabase = supabaseAdmin;

  // 1. Extraer datos del formulario
  const nombre = formData.get("nombre") as string;
  const apellido = formData.get("apellido") as string;
  const email = formData.get("email") as string;
  const matricula = formData.get("matricula") as string;
  const especialidadId = formData.get("especialidad") as string;

  const especialidadNombre = especialidadId
    ? (await prisma.especialidad.findUnique({ where: { id: especialidadId }, select: { nombre: true } }))?.nombre ?? especialidadId
    : "No especificada";

  // Validación de servidor básica
  if (!nombre || !apellido || !email || !matricula) {
    return { error: "Faltan campos obligatorios" };
  }
  // 2. Subir archivos a Supabase Storage en paralelo
  const archivosKeys = ["dni", "titulo", "cuit", "seguro", "cv", "matricula_file", "super_salud", "habilitacion"];
  const archivosUrls: Record<string, string | null> = {};

  try {
    await Promise.all(archivosKeys.map(async (key) => {
      const archivo = formData.get(key) as File;
      if (archivo && archivo.size > 0) {
        const fileExt = archivo.name.split('.').pop();
        const fileName = `${matricula}-${key}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('solicitudes')
          .upload(fileName, archivo);

        if (uploadError) {
          throw new Error(`Error subiendo ${key}: ${uploadError.message}`);
        }
        
        archivosUrls[key] = fileName;
      }
    }));
  } catch (uploadError: any) {
    console.error("Error en subida paralela:", uploadError);
    return { error: uploadError.message };
  }

  // 3. Guardar en la base de datos
  try {
    await prisma.solicitud.create({
      data: {
        nombre,
        apellido,
        email,
        matricula,
        status: "PENDIENTE",
        datos: {
          dni: formData.get("dni") as string,
          telefono: formData.get("telefono") as string,
          direccion: formData.get("direccion") as string,
          localidadId: formData.get("localidadId") as string,
          especialidad: formData.get("especialidad") as string,
          archivos: archivosUrls,
          fecha_solicitud: new Date().toISOString(),
        },
      },
    });
    
    // 4. Enviar mail institucional (Aviso)
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_...") {
      try {
        await resend.emails.send({
          from: 'Círculo Kinesiólogos <onboarding@resend.dev>',
          to: ['institucional@circulokinesiologos.com'], // Cambiar por el real
          subject: `Nueva Solicitud de Asociación: ${nombre} ${apellido}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
              <div style="background: #0f172a; padding: 20px; color: white; text-align: center;">
                <h1 style="margin: 0;">Nueva Solicitud</h1>
              </div>
              <div style="padding: 30px;">
                <p>Se ha recibido una nueva solicitud de ingreso al Círculo:</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p><strong>Profesional:</strong> ${nombre} ${apellido}</p>
                <p><strong>Matrícula:</strong> ${matricula}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Especialidad:</strong> ${especialidadNombre}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p>Podés revisar la documentación y aprobar la solicitud desde el panel administrativo:</p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/solicitudes" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">
                  Ir al Panel de Control
                </a>
              </div>
              <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                Este es un mensaje automático del sistema de gestión de Círculo Kinesiólogos.
              </div>
            </div>
          `
        });
      } catch (mailError) {
        console.error("Error enviando mail:", mailError);
        // No bloqueamos el éxito del registro si falla el mail de aviso
      }
    }

    revalidatePath("/admin/solicitudes");
  } catch (error: any) {
    console.error("Error al crear solicitud:", error);
    return { error: `Error DB: ${error.message || "Desconocido"}` };
  }

  redirect("/registro/exito");
}
