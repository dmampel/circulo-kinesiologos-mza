"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProfesionalRepository, type UpdateProfesionalData } from "@/lib/repositories/ProfesionalRepository";
import { LocalidadRepository } from "@/lib/repositories/LocalidadRepository";
import { EspecialidadRepository } from "@/lib/repositories/EspecialidadRepository";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ActionResult = { success: true } | { success: false; error: string };

// ─────────────────────────────────────────────────────────────────────────────
// Actualizar datos de contacto (texto)
// ─────────────────────────────────────────────────────────────────────────────
export async function updateDatosContacto(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data: UpdateProfesionalData = {
    telefono: (formData.get("telefono") as string) || undefined,
    whatsapp: (formData.get("whatsapp") as string) || undefined,
    direccion: (formData.get("direccion") as string) || undefined,
    horarios: (formData.get("horarios") as string) || undefined,
  };

  if (formData.has("nombre")) {
    const nombre = ((formData.get("nombre") as string) || "").trim();
    if (!nombre) return { success: false, error: "El nombre es obligatorio." };
    data.nombre = nombre;
  }

  if (formData.has("apellido")) {
    const apellido = ((formData.get("apellido") as string) || "").trim();
    if (!apellido) return { success: false, error: "El apellido es obligatorio." };
    data.apellido = apellido;
  }

  // La matrícula es única en toda la base: se valida formato y colisión con
  // otro profesional antes de guardar, igual que la localidad más abajo.
  if (formData.has("matricula")) {
    const matricula = ((formData.get("matricula") as string) || "").trim();
    if (!matricula) return { success: false, error: "La matrícula es obligatoria." };
    if (!/^[a-zA-Z0-9_-]+$/.test(matricula)) {
      return { success: false, error: "La matrícula contiene caracteres no permitidos." };
    }
    const existente = await ProfesionalRepository.findByMatricula(matricula);
    if (existente && existente.userId !== user.id) {
      return { success: false, error: "Esa matrícula ya está registrada por otro profesional." };
    }
    data.matricula = matricula;
  }

  // Las especialidades son una relación M:N: mismo motivo que la localidad,
  // se valida contra el catálogo real antes de pasarlas a Prisma.
  if (formData.has("especialidadesEnviadas")) {
    const especialidadIds = formData.getAll("especialidadIds").map(String);
    if (especialidadIds.length === 0) {
      return { success: false, error: "Tenés que elegir al menos una especialidad." };
    }
    const especialidades = await EspecialidadRepository.getAll();
    const validas = new Set(especialidades.map((e) => e.id));
    if (!especialidadIds.every((id) => validas.has(id))) {
      return { success: false, error: "Una de las especialidades seleccionadas no es válida." };
    }
    data.especialidadIds = especialidadIds;
  }

  // La localidad es una FK: no se confía en el value que llega del <select>.
  // Sin esta validación un id inventado explota como error de FK en Prisma y
  // el socio sólo vería el mensaje genérico de "no se pudieron guardar".
  const localidadId = (formData.get("localidadId") as string) || undefined;
  if (localidadId) {
    const localidades = await LocalidadRepository.getAll();
    if (!localidades.some((l) => l.id === localidadId)) {
      return { success: false, error: "La localidad seleccionada no es válida." };
    }
    data.localidadId = localidadId;
  }

  try {
    const actualizado = await ProfesionalRepository.update(user.id, data);
    revalidatePath("/mi-panel");
    revalidatePath("/mi-panel/perfil");
    // El Padrón Público muestra estos datos y filtra por localidad. El perfil
    // individual es ISR de 1h: sin esto, el socio no vería su cambio reflejado.
    revalidatePath("/profesionales");
    revalidatePath(`/profesionales/${actualizado.slug}`);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudieron guardar los cambios. Intentá de nuevo." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Actualizar foto de perfil (upload a Supabase Storage)
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export async function updateFotoPerfil(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const file = formData.get("foto") as File | null;

  if (!file || file.size === 0) {
    return { success: false, error: "No se recibió ningún archivo." };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: "La imagen no puede superar los 2MB." };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Formato no permitido. Usá JPG, PNG o WebP.",
    };
  }

  // Extraer extensión del tipo MIME
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const newPath = `${user.id}/${Date.now()}.${ext}`;

  // Borrar foto anterior si existe
  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (profesional?.foto_url) {
    try {
      const url = new URL(profesional.foto_url);
      const pathParts = url.pathname.split("/profesionales-fotos/");
      if (pathParts.length === 2) {
        await supabaseAdmin.storage.from("profesionales-fotos").remove([pathParts[1]]);
      }
    } catch {
      // no bloquear el flujo principal si falla el borrado
    }
  }

  // Subir nueva foto
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("profesionales-fotos")
    .upload(newPath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: "Error al subir la imagen. Intentá de nuevo." };
  }

  // Obtener URL pública
  const { data: urlData } = supabaseAdmin.storage
    .from("profesionales-fotos")
    .getPublicUrl(newPath);

  // Guardar URL en DB
  try {
    await ProfesionalRepository.update(user.id, { foto_url: urlData.publicUrl });
    revalidatePath("/mi-panel");
    revalidatePath("/mi-panel/perfil");
    return { success: true };
  } catch {
    return { success: false, error: "Imagen subida, pero no se pudo guardar la URL. Contactá soporte." };
  }
}
