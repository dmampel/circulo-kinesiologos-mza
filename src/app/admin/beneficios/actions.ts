"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function crearBeneficio(formData: FormData) {
  try {
    const supabase = await createClient();
    
    const empresa = formData.get("empresa") as string;
    const descripcion = formData.get("descripcion") as string;
    const descuento = formData.get("descuento") as string;
    const categoria = formData.get("categoria") as string;
    const enlace = formData.get("enlace") as string;
    const logo = formData.get("logo") as File;

    let logo_url = null;

    // 1. Subir logo si existe
    if (logo && logo.size > 0) {
      const fileExt = logo.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `beneficios/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("solicitudes") 
        .upload(filePath, logo);

      if (uploadError) throw new Error("Error subiendo logo: " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from("solicitudes")
        .getPublicUrl(filePath);
        
      logo_url = publicUrl;
    }

    // 2. Guardar en DB
    await prisma.beneficioKineClub.create({
      data: {
        empresa,
        descripcion,
        descuento,
        categoria: categoria as any,
        logo_url,
        url: enlace,
      },
    });

    revalidatePath("/admin/beneficios");
    revalidatePath("/kineclub");

    return { success: true };
  } catch (error: any) {
    console.error("Error al crear beneficio:", error);
    return { success: false, error: error.message };
  }
}

export async function eliminarBeneficio(id: string) {
  try {
    await prisma.beneficioKineClub.delete({ where: { id } });
    revalidatePath("/admin/beneficios");
    revalidatePath("/kineclub");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
