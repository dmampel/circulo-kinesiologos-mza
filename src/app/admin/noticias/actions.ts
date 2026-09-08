"use server";

import { revalidatePath, updateTag } from "next/cache";
import { NoticiaRepository } from "@/lib/repositories/NoticiaRepository";
import { requireAdmin } from "@/utils/supabase/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { borrarImagenesDeStorage } from "@/lib/storage/noticias";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  noticiaSchema,
} from "@/lib/validations/noticia";

function generarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function mensajeDeError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function parseImagenesField(formData: FormData): { url: string; alt?: string | null }[] {
  const raw = formData.get("imagenes") as string | null;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function subirImagenNoticia(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "No autorizado." };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "No se recibió ningún archivo." };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return { success: false, error: "Tipo de archivo no permitido. Usá JPEG, PNG, WEBP o AVIF." };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { success: false, error: "El archivo supera el tamaño máximo de 4 MB." };
  }

  try {
    const ext = file.name.split(".").pop() || "jpg";
    const newPath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("noticias-imagenes")
      .upload(newPath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: "No se pudo subir la imagen." };
    }

    const { data } = supabaseAdmin.storage.from("noticias-imagenes").getPublicUrl(newPath);

    return { success: true, url: data.publicUrl };
  } catch (error: unknown) {
    return { success: false, error: mensajeDeError(error, "No se pudo subir la imagen.") };
  }
}

export async function crearNoticia(formData: FormData) {
  await requireAdmin();
  try {
    const parsed = noticiaSchema.safeParse({
      titulo: formData.get("titulo") as string,
      resumen: (formData.get("resumen") as string) || null,
      contenido: formData.get("contenido") as string,
      categoriaId: (formData.get("categoriaId") as string) || null,
      publicada: formData.get("publicada") === "on",
      imagenes: parseImagenesField(formData),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    }

    const { titulo, resumen, contenido, categoriaId, publicada, imagenes } = parsed.data;
    const slug = generarSlug(titulo);

    const nuevaNoticia = await NoticiaRepository.create({
      titulo,
      slug,
      resumen,
      contenido,
      publicada,
      publicada_en: publicada ? new Date() : null,
      ...(categoriaId ? { categoria: { connect: { id: categoriaId } } } : {}),
    });

    await NoticiaRepository.replaceImagenes(nuevaNoticia.id, imagenes);

    revalidatePath("/admin/noticias");
    revalidatePath("/noticias");
    revalidatePath("/");
    // El conteo de noticias por categoría está embebido en el resultado
    // cacheado de CategoriaNoticiaRepository.getAll() (grupo 3, tarea 3.3) —
    // hay que invalidarlo también acá, no sólo desde categoria-actions.ts.
    updateTag("categorias-noticias");

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: mensajeDeError(error, "Ocurrió un error inesperado.") };
  }
}

export async function actualizarNoticia(id: string, formData: FormData) {
  await requireAdmin();
  try {
    const parsed = noticiaSchema.safeParse({
      titulo: formData.get("titulo") as string,
      resumen: (formData.get("resumen") as string) || null,
      contenido: formData.get("contenido") as string,
      categoriaId: (formData.get("categoriaId") as string) || null,
      publicada: formData.get("publicada") === "on",
      imagenes: parseImagenesField(formData),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    }

    const { titulo, resumen, contenido, categoriaId, publicada, imagenes } = parsed.data;
    const slug = generarSlug(titulo);

    const existing = await NoticiaRepository.getById(id);
    const publicada_en =
      publicada && !existing?.publicada ? new Date() : existing?.publicada_en ?? null;

    const urlsViejas = (existing?.imagenes ?? []).map((img) => img.url);
    const urlsNuevas = new Set(imagenes.map((img) => img.url));
    const urlsQuitadas = urlsViejas.filter((url) => !urlsNuevas.has(url));

    await NoticiaRepository.update(id, {
      titulo,
      slug,
      resumen,
      contenido,
      publicada,
      publicada_en,
      categoriaId,
    });

    await NoticiaRepository.replaceImagenes(id, imagenes);

    if (urlsQuitadas.length > 0) {
      await borrarImagenesDeStorage(urlsQuitadas);
    }

    revalidatePath("/admin/noticias");
    revalidatePath("/noticias");
    revalidatePath("/");
    updateTag("categorias-noticias");

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: mensajeDeError(error, "Ocurrió un error inesperado.") };
  }
}

export async function eliminarNoticia(id: string) {
  await requireAdmin();
  try {
    const existing = await NoticiaRepository.getById(id);
    const urls = (existing?.imagenes ?? []).map((img) => img.url);

    await NoticiaRepository.delete(id); // cascade limpia NoticiaImagen

    if (urls.length > 0) {
      await borrarImagenesDeStorage(urls);
    }

    revalidatePath("/admin/noticias");
    updateTag("categorias-noticias");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: mensajeDeError(error, "Ocurrió un error inesperado.") };
  }
}

export async function eliminarNoticiaAction(id: string): Promise<void> {
  await eliminarNoticia(id);
}
