"use server";

import { z } from "zod";
import { CircularRepository } from "@/lib/repositories/CircularRepository";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const circularSchema = z.object({
  titulo: z.string().min(1, "El título es requerido").max(200),
  etiqueta: z.string().min(1, "La etiqueta es requerida").max(50),
  contenido: z.string().max(5000).optional().nullable(),
  archivo_url: z.union([z.url(), z.literal(""), z.null()]).optional(),
  publicada: z.boolean(),
});

// ─── Storage Helpers ─────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = file.name.split(".").pop();
  const newPath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from("circulares-adjuntos")
    .upload(newPath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error("No se pudo subir el archivo adjunto.");
  }

  const { data } = supabaseAdmin.storage
    .from("circulares-adjuntos")
    .getPublicUrl(newPath);

  return data.publicUrl;
}

async function deleteStorageFile(url: string): Promise<void> {
  if (!url.includes("circulares-adjuntos")) return;

  try {
    const parsed = new URL(url);
    // pathname looks like /storage/v1/object/public/circulares-adjuntos/filename.ext
    const marker = "/circulares-adjuntos/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return;
    const filePath = parsed.pathname.slice(idx + marker.length);
    if (!filePath) return;

    await supabaseAdmin.storage.from("circulares-adjuntos").remove([filePath]);
  } catch {
    // Non-critical: log internally but don't surface to the user
  }
}

// ─── Server Actions ───────────────────────────────────────────────────────────

export async function createCircular(formData: FormData) {
  const titulo = formData.get("titulo") as string;
  const etiqueta = formData.get("etiqueta") as string;
  const contenido = formData.get("contenido") as string | null;
  const publicada = formData.get("publicada") === "on";

  const parsed = circularSchema.safeParse({
    titulo,
    etiqueta,
    contenido: contenido || null,
    archivo_url: null,
    publicada,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join(", "));
  }

  let archivo_url = formData.get("archivo_url") as string | null;
  const archivo_file = formData.get("archivo_file") as File | null;

  if (archivo_file && archivo_file.size > 0) {
    const uploadedUrl = await uploadFile(archivo_file);
    if (uploadedUrl) archivo_url = uploadedUrl;
  }

  await CircularRepository.create({
    titulo,
    etiqueta,
    contenido: contenido || null,
    archivo_url: archivo_url || null,
    publicada,
    publicada_en: publicada ? new Date() : null,
  });

  revalidatePath("/admin/circulares");
  revalidatePath("/mi-panel");
  redirect("/admin/circulares");
}

export async function updateCircular(id: string, formData: FormData) {
  const titulo = formData.get("titulo") as string;
  const etiqueta = formData.get("etiqueta") as string;
  const contenido = formData.get("contenido") as string | null;
  const publicada = formData.get("publicada") === "on";

  const parsed = circularSchema.safeParse({
    titulo,
    etiqueta,
    contenido: contenido || null,
    archivo_url: null,
    publicada,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join(", "));
  }

  // archivo_url from formData is the OLD url (defaultValue from the form)
  const oldArchivoUrl = formData.get("archivo_url") as string | null;
  const archivo_file = formData.get("archivo_file") as File | null;

  let archivo_url = oldArchivoUrl;

  if (archivo_file && archivo_file.size > 0) {
    if (oldArchivoUrl && oldArchivoUrl.includes("circulares-adjuntos")) {
      await deleteStorageFile(oldArchivoUrl);
    }
    const uploadedUrl = await uploadFile(archivo_file);
    if (uploadedUrl) archivo_url = uploadedUrl;
  }

  const wasPublishedBefore = formData.get("was_published") === "true";

  let publicada_en = undefined;
  if (publicada && !wasPublishedBefore) {
    publicada_en = new Date();
  } else if (!publicada) {
    publicada_en = null;
  }

  await CircularRepository.update(id, {
    titulo,
    etiqueta,
    contenido: contenido || null,
    archivo_url: archivo_url || null,
    publicada,
    ...(publicada_en !== undefined && { publicada_en }),
  });

  revalidatePath("/admin/circulares");
  revalidatePath("/mi-panel");
  redirect("/admin/circulares");
}

export async function togglePublicada(id: string, currentState: boolean) {
  await CircularRepository.update(id, {
    publicada: !currentState,
    publicada_en: !currentState ? new Date() : null,
  });

  revalidatePath("/admin/circulares");
  revalidatePath("/mi-panel");
}

export async function deleteCircular(id: string) {
  try {
    const circular = await CircularRepository.getById(id);
    if (circular?.archivo_url && circular.archivo_url.includes("circulares-adjuntos")) {
      await deleteStorageFile(circular.archivo_url);
    }
    await CircularRepository.delete(id);

    revalidatePath("/admin/circulares");
    revalidatePath("/mi-panel");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    throw new Error("No se pudo eliminar la circular.");
  }
}
