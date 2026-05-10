"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
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

  const data = {
    telefono: (formData.get("telefono") as string) || undefined,
    whatsapp: (formData.get("whatsapp") as string) || undefined,
    direccion: (formData.get("direccion") as string) || undefined,
    horarios: (formData.get("horarios") as string) || undefined,
  };

  try {
    await ProfesionalRepository.update(user.id, data);
    revalidatePath("/mi-panel");
    revalidatePath("/mi-panel/perfil");
    return { success: true };
  } catch (error) {
    console.error("updateDatosContacto error:", error);
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
      // La URL pública tiene el formato: .../storage/v1/object/public/profesionales-fotos/{path}
      const url = new URL(profesional.foto_url);
      const pathParts = url.pathname.split("/profesionales-fotos/");
      if (pathParts.length === 2) {
        const oldPath = pathParts[1];
        await supabaseAdmin.storage
          .from("profesionales-fotos")
          .remove([oldPath]);
      }
    } catch {
      // No bloquear el flujo si la eliminación falla
      console.warn("No se pudo eliminar la foto anterior.");
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
    console.error("Storage upload error:", uploadError);
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
  } catch (error) {
    console.error("updateFotoPerfil DB error:", error);
    return { success: false, error: "Imagen subida, pero no se pudo guardar la URL. Contactá soporte." };
  }
}
