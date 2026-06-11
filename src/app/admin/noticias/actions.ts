"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NoticiaRepository } from "@/lib/repositories/NoticiaRepository";
import { requireAdmin } from "@/utils/supabase/require-admin";

export async function crearNoticia(formData: FormData) {
  await requireAdmin();
  try {
    
    const titulo = formData.get("titulo") as string;
    const resumen = formData.get("resumen") as string;
    const contenido = formData.get("contenido") as string;
    const publicada = formData.get("publicada") === "on";
    const imagen_url = formData.get("imagen_url") as string;
    const categoriaId = (formData.get("categoriaId") as string) || null;

    // 2. Generar Slug
    const slug = titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // 3. Guardar en DB
    await prisma.noticia.create({
      data: {
        titulo,
        slug,
        resumen,
        contenido,
        imagen_url,
        publicada,
        publicada_en: publicada ? new Date() : null,
        categoriaId,
      },
    });

    revalidatePath("/admin/noticias");
    revalidatePath("/noticias");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function actualizarNoticia(id: string, formData: FormData) {
  await requireAdmin();
  try {
    const titulo = formData.get("titulo") as string;
    const resumen = formData.get("resumen") as string;
    const contenido = formData.get("contenido") as string;
    const publicada = formData.get("publicada") === "on";
    const imagen_url = formData.get("imagen_url") as string;
    const categoriaId = (formData.get("categoriaId") as string) || null;

    const slug = titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await NoticiaRepository.getById(id);
    const publicada_en =
      publicada && !existing?.publicada ? new Date() : existing?.publicada_en ?? null;

    await NoticiaRepository.update(id, {
      titulo,
      slug,
      resumen,
      contenido,
      imagen_url,
      publicada,
      publicada_en,
      categoriaId,
    });

    revalidatePath("/admin/noticias");
    revalidatePath("/noticias");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function eliminarNoticia(id: string) {
  await requireAdmin();
  try {
    await prisma.noticia.delete({ where: { id } });
    revalidatePath("/admin/noticias");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function eliminarNoticiaAction(id: string): Promise<void> {
  await eliminarNoticia(id);
}
