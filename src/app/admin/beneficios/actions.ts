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
    const categoriaId = formData.get("categoriaId") as string;
    const enlace = formData.get("enlace") as string;
    const logo_url = formData.get("logo_url") as string;

    // 2. Guardar en DB
    await prisma.beneficioKineClub.create({
      data: {
        empresa,
        descripcion,
        descuento,
        categoriaId,
        logo_url,
        url: enlace,
      },
    });

    revalidatePath("/admin/beneficios");
    revalidatePath("/kineclub");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}



export async function actualizarBeneficio(id: string, formData: FormData) {
  try {
    const empresa = formData.get("empresa") as string;
    const descripcion = formData.get("descripcion") as string;
    const descuento = formData.get("descuento") as string;
    const categoriaId = formData.get("categoriaId") as string;
    const enlace = formData.get("enlace") as string;
    const logo_url = formData.get("logo_url") as string;

    await prisma.beneficioKineClub.update({
      where: { id },
      data: {
        empresa,
        descripcion,
        descuento,
        categoriaId,
        logo_url,
        url: enlace,
      },
    });

    revalidatePath("/admin/beneficios");
    revalidatePath("/kineclub");

    return { success: true };
  } catch (error: any) {
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

export async function eliminarBeneficioAction(id: string): Promise<void> {
  await eliminarBeneficio(id);
}

