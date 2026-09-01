"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getResend, canSendEmails, FROM_EMAIL, INSTITUTIONAL_EMAIL } from "@/lib/resend";
import {
  ARCHIVOS_REQUERIDOS,
  construirPathArchivo,
  crearSolicitudSchema,
  prepararSubidaSchema,
} from "@/lib/validations/solicitud";
import { SITE_URL } from "@/lib/site";
import { EMAIL_INSTITUCIONAL } from "@/lib/site";

const BUCKET_SOLICITUDES = "solicitudes";

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

/**
 * Verifica si ya existe una Solicitud registrada con el mismo email, matrícula,
 * CUIL/DNI o teléfono. Devuelve el mensaje de error del primer duplicado encontrado,
 * o `null` si no hay ninguno.
 */
export async function verificarDuplicados(input: {
  email: string;
  matricula: string;
  cuil?: string;
  telefono?: string;
}): Promise<string | null> {
  const [emailExistente, matriculaExistente, cuilExistente, telefonoExistente] = await Promise.all([
    prisma.solicitud.findFirst({ where: { email: input.email } }),
    prisma.solicitud.findFirst({ where: { matricula: input.matricula } }),
    input.cuil
      ? prisma.solicitud.findFirst({ where: { datos: { path: ["dni"], equals: input.cuil } } })
      : null,
    input.telefono
      ? prisma.solicitud.findFirst({ where: { datos: { path: ["telefono"], equals: input.telefono } } })
      : null,
  ]);

  if (emailExistente) return "Ya existe una solicitud registrada con ese email.";
  if (matriculaExistente) return "Ya existe una solicitud registrada con esa matrícula.";
  if (cuilExistente) return "Ya existe una solicitud registrada con ese CUIL/DNI.";
  if (telefonoExistente) return "Ya existe una solicitud registrada con ese teléfono.";
  return null;
}

type ManifiestoInput = {
  key: string;
  nombre: string;
  tamano: number;
  tipo: string;
};

type PrepararSubidaInput = {
  nombre: string;
  apellido: string;
  email: string;
  matricula: string;
  dni: string;
  telefono: string;
  manifiesto: ManifiestoInput[];
};

type PrepararSubidaResult =
  | { success: true; uploads: Array<{ key: string; path: string; token: string }> }
  | { success: false; error: string };

/**
 * Paso 1 del flujo de registro: valida datos de texto + manifiesto de archivos,
 * chequea duplicados y — sólo si todo pasa — emite una signed upload URL por
 * documento con el path elegido por el servidor. Nunca lanza al cliente.
 */
export async function prepararSubidaSolicitud(input: PrepararSubidaInput): Promise<PrepararSubidaResult> {
  try {
    const parsed = prepararSubidaSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const { email, matricula, dni, telefono, manifiesto } = parsed.data;

    const errorDuplicado = await verificarDuplicados({ email, matricula, cuil: dni, telefono });
    if (errorDuplicado) {
      return { success: false, error: errorDuplicado };
    }

    const uploads = await Promise.all(
      manifiesto.map(async (documento) => {
        const path = construirPathArchivo(matricula, documento.key, documento.nombre);

        const { data, error } = await supabaseAdmin.storage
          .from(BUCKET_SOLICITUDES)
          .createSignedUploadUrl(path);

        if (error || !data) {
          throw new Error(
            `No se pudo generar el permiso de subida para "${documento.key}": ${error?.message ?? "error desconocido"}`
          );
        }

        return { key: documento.key, path, token: data.token };
      })
    );

    return { success: true, uploads };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo preparar la subida de documentos.";
    return { success: false, error: message };
  }
}

type CrearSolicitudInput = {
  nombre: string;
  apellido: string;
  email: string;
  matricula: string;
  dni: string;
  telefono: string;
  direccion: string;
  localidadId: string;
  especialidad: string;
  archivos: Record<string, string>;
};

/**
 * Paso 3 del flujo de registro: persiste la Solicitud a partir de paths ya
 * subidos a Storage. No confía en el payload del cliente: re-chequea duplicados
 * (protección de carrera) y verifica contra Storage que cada path exista y
 * respete el prefijo `${matricula}-${key}-` emitido por el servidor.
 */
export async function crearSolicitud(input: CrearSolicitudInput): Promise<{ success: boolean; error?: string }> {
  const parsed = crearSolicitudSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { nombre, apellido, email, matricula, dni, telefono, direccion, localidadId, especialidad, archivos } =
    parsed.data;

  // Re-ejecutar verificación de duplicados: protección contra carrera entre
  // prepararSubidaSolicitud y crearSolicitud.
  const errorDuplicado = await verificarDuplicados({ email, matricula, cuil: dni, telefono });
  if (errorDuplicado) {
    return { success: false, error: errorDuplicado };
  }

  // Confirmar que están los 6 documentos obligatorios.
  for (const key of ARCHIVOS_REQUERIDOS) {
    if (!archivos[key]) {
      return { success: false, error: `El documento "${key}" es obligatorio.` };
    }
  }

  // El payload de archivos es tan falsificable como cualquier request del cliente:
  // verificar contra Storage que cada path exista y respete el prefijo esperado.
  for (const [key, path] of Object.entries(archivos)) {
    const prefijoEsperado = `${matricula}-${key}-`;
    if (!path.startsWith(prefijoEsperado)) {
      return { success: false, error: `El documento "${key}" no es válido.` };
    }

    const { data: listado, error: listError } = await supabaseAdmin.storage
      .from(BUCKET_SOLICITUDES)
      .list("", { search: prefijoEsperado });

    if (listError || !listado?.some((objeto) => objeto.name === path)) {
      return { success: false, error: `El documento "${key}" no se encuentra en el almacenamiento.` };
    }
  }

  let especialidadNombre = especialidad;
  try {
    const especialidadRegistro = especialidad
      ? await prisma.especialidad.findUnique({ where: { id: especialidad }, select: { nombre: true } })
      : null;
    if (especialidadRegistro?.nombre) especialidadNombre = especialidadRegistro.nombre;
  } catch {
    // best-effort: si no se puede resolver el nombre de la especialidad, se usa el valor recibido
  }

  try {
    await prisma.solicitud.create({
      data: {
        nombre,
        apellido,
        email,
        matricula,
        status: "PENDIENTE",
        datos: {
          dni,
          telefono,
          direccion,
          localidadId,
          especialidad,
          archivos,
          fecha_solicitud: new Date().toISOString(),
        },
      },
    });

    if (canSendEmails()) {
      const resend = getResend();
      const siteUrl = SITE_URL;

      // Aviso institucional
      try {
        await resend.emails.send({
          from: `Círculo Kinesiólogos <${FROM_EMAIL}>`,
          to: [INSTITUTIONAL_EMAIL],
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
                <a href="${siteUrl}/admin/solicitudes"
                   style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">
                  Ir al Panel de Control
                </a>
              </div>
              <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                Este es un mensaje automático del sistema de gestión de Círculo Kinesiólogos.
              </div>
            </div>
          `,
        });
      } catch {
        // no bloquear si falla el aviso institucional
      }

      // Confirmación al solicitante
      try {
        await resend.emails.send({
          from: `Círculo Kinesiólogos <${FROM_EMAIL}>`,
          to: [email],
          subject: `Recibimos tu solicitud de asociación`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
              <div style="background: #0f172a; padding: 20px; color: white; text-align: center;">
                <h1 style="margin: 0;">¡Solicitud recibida!</h1>
              </div>
              <div style="padding: 30px;">
                <p>Hola <strong>${nombre}</strong>,</p>
                <p>Recibimos tu solicitud de asociación al Círculo de Kinesiólogos de Mendoza. Nuestro equipo revisará tu documentación y te contactaremos a la brevedad.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p><strong>Matrícula:</strong> ${matricula}</p>
                <p><strong>Especialidad:</strong> ${especialidadNombre}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p>Este es un correo automático, no respondas a esta dirección. Si tenés alguna consulta, escribinos a <a href="mailto:${EMAIL_INSTITUCIONAL}">${EMAIL_INSTITUCIONAL}</a>.</p>
              </div>
              <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                Este es un mensaje automático del sistema de gestión de Círculo Kinesiólogos.
              </div>
            </div>
          `,
        });
      } catch {
        // no bloquear si falla la confirmación al solicitante
      }
    }

    revalidatePath("/admin/solicitudes");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Desconocido";
    return { success: false, error: `Error DB: ${message}` };
  }

  return { success: true };
}

/**
 * Limpieza best-effort de objetos huérfanos en Storage cuando la subida se
 * completó pero la creación de la Solicitud falló, o el usuario abandonó.
 * Nunca lanza: es invocada desde el `catch` del cliente.
 */
export async function cancelarSubidaSolicitud(paths: string[]): Promise<void> {
  if (!paths.length) return;

  try {
    await supabaseAdmin.storage.from(BUCKET_SOLICITUDES).remove(paths);
  } catch {
    // best-effort: nunca debe lanzar
  }
}
