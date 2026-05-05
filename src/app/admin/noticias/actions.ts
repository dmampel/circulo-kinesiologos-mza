"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function crearNoticia(formData: FormData) {
  try {
    const supabase = await createClient();
    
    const titulo = formData.get("titulo") as string;
    const resumen = formData.get("resumen") as string;
    const contenido = formData.get("contenido") as string;
    const publicada = formData.get("publicada") === "on";
    const imagen = formData.get("imagen") as File;

    let imagen_url = null;

    // 1. Subir imagen si existe
    if (imagen && imagen.size > 0) {
      const fileExt = imagen.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `noticias/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("solicitudes") 
        .upload(filePath, imagen);

      if (uploadError) throw new Error("Error subiendo imagen: " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from("solicitudes")
        .getPublicUrl(filePath);
        
      imagen_url = publicUrl;
    }

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
      },
    });

    revalidatePath("/admin/noticias");
    revalidatePath("/noticias");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Error al crear noticia:", error);
    return { success: false, error: error.message };
  }
}

export async function eliminarNoticia(id: string) {
  try {
    await prisma.noticia.delete({ where: { id } });
    revalidatePath("/admin/noticias");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
