"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AvisoRepository } from "@/lib/repositories/AvisoRepository";
import { BUCKET_BOLSA_TRABAJO_CV, firmarCv } from "@/lib/storage/bolsaTrabajo";
import {
  HONEYPOT_FIELD,
  crearAvisoBuscoTrabajoSchema,
  crearAvisoBuscoKinesiologoSchema,
  cvFileSchema,
} from "@/lib/validations/bolsaDeTrabajo";

type ActionResult = { success: boolean; error?: string };

type TipoAviso = "busco-trabajo" | "busco-kinesiologo";

type ContactoPublicable =
  | { tipo: "busco-trabajo"; telefono: string; email: string; cvUrl: string | null }
  | { tipo: "busco-kinesiologo"; medioContacto: string };

type RevelarContactoResult = { success: true; contacto: ContactoPublicable } | { success: false; error: string };

/** Extrae la extensión del nombre original del archivo. `""` si no tiene. */
function extraerExtension(nombreOriginal: string): string {
  const partes = nombreOriginal.split(".");
  return partes.length > 1 ? partes[partes.length - 1]!.toLowerCase() : "";
}

/**
 * Sube el CV con un nombre generado por el servidor (`design.md — D4`):
 * nunca se usa el nombre original del archivo. Devuelve el path del objeto
 * en el bucket privado `bolsa-trabajo-cv`, o lanza si Storage falla — la
 * subida del CV, a diferencia de su firma en el revelado, sí debe frenar el
 * alta: si no se pudo guardar el archivo, publicar el aviso sin él no es lo
 * que el kinesiólogo pidió.
 */
async function subirCv(archivo: File): Promise<string> {
  const path = `${crypto.randomUUID()}.${extraerExtension(archivo.name)}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_BOLSA_TRABAJO_CV)
    .upload(path, archivo, { contentType: archivo.type });

  if (error) {
    throw new Error("No se pudo subir el CV. Probá de nuevo en unos minutos.");
  }

  return path;
}

/**
 * Alta del aviso "Busco trabajo" (kinesiólogo). Valida en el servidor
 * (`design.md — D9`), sube el CV si vino adjunto, y persiste el consentimiento
 * con su timestamp. El aviso arranca `PENDIENTE` (default del schema —
 * moderación confirmada, `design.md — D6`).
 */
export async function crearAvisoBuscoTrabajo(formData: FormData): Promise<ActionResult> {
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = crearAvisoBuscoTrabajoSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    // Honeypot: si el campo oculto viene con contenido, se responde éxito
    // sin persistir nada — que el bot crea que funcionó (design.md — D9).
    if (parsed.data[HONEYPOT_FIELD]) {
      return { success: true };
    }

    const data = parsed.data;

    let cvPath: string | null = null;
    const cvCandidato = formData.get("cv");
    if (cvCandidato instanceof File && cvCandidato.size > 0) {
      const cvParsed = cvFileSchema.safeParse(cvCandidato);
      if (!cvParsed.success) {
        return { success: false, error: cvParsed.error.issues[0]?.message ?? "El CV no es válido." };
      }
      cvPath = await subirCv(cvCandidato);
    }

    await AvisoRepository.crearBuscoTrabajo({
      nombre: data.nombre,
      apellido: data.apellido,
      matricula: data.matricula,
      telefono: data.telefono,
      email: data.email,
      cvPath,
      especialidadId: data.especialidadId,
      localidadId: data.localidadId,
      zona: data.zona,
      disponibilidad: data.disponibilidad,
      presentacion: data.presentacion,
      aceptadoEn: new Date(),
    });

    revalidatePath("/admin/bolsa-de-trabajo");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo publicar el aviso.";
    return { success: false, error: message };
  }
}

/**
 * Alta del aviso "Busco kinesiólogo" (institución). Mismo patrón que
 * `crearAvisoBuscoTrabajo`, sin adjunto.
 */
export async function crearAvisoBuscoKinesiologo(formData: FormData): Promise<ActionResult> {
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = crearAvisoBuscoKinesiologoSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    if (parsed.data[HONEYPOT_FIELD]) {
      return { success: true };
    }

    const data = parsed.data;

    await AvisoRepository.crearBuscoKinesiologo({
      institucion: data.institucion,
      localidadId: data.localidadId,
      zona: data.zona,
      area: data.area,
      tipoPuesto: data.tipoPuesto,
      diasHorarios: data.diasHorarios,
      requisitos: data.requisitos,
      modalidad: data.modalidad,
      propuesta: data.propuesta,
      medioContacto: data.medioContacto,
      fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : null,
      aceptadoEn: new Date(),
    });

    revalidatePath("/admin/bolsa-de-trabajo");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo publicar el aviso.";
    return { success: false, error: message };
  }
}

/**
 * Revela el contacto de un aviso (`design.md — D3`). Sólo devuelve datos si
 * el aviso está `PUBLICADO` — el repositorio ya lo garantiza devolviendo
 * `null` en cualquier otro caso, así que acá no hace falta repetir el chequeo.
 * Si la firma del CV falla, el resto del contacto igual se revela y el CV se
 * marca como no disponible (nunca bloquea el resto del contacto).
 */
export async function revelarContacto(tipo: TipoAviso, id: string): Promise<RevelarContactoResult> {
  try {
    if (tipo === "busco-trabajo") {
      const contacto = await AvisoRepository.findContactoBuscoTrabajo(id);
      if (!contacto) {
        return { success: false, error: "Este aviso ya no está disponible." };
      }

      const cvUrl = contacto.cvPath ? await firmarCv(contacto.cvPath) : null;

      return {
        success: true,
        contacto: { tipo: "busco-trabajo", telefono: contacto.telefono, email: contacto.email, cvUrl },
      };
    }

    const contacto = await AvisoRepository.findContactoBuscoKinesiologo(id);
    if (!contacto) {
      return { success: false, error: "Este aviso ya no está disponible." };
    }

    return { success: true, contacto: { tipo: "busco-kinesiologo", medioContacto: contacto.medioContacto } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo obtener el contacto.";
    return { success: false, error: message };
  }
}
