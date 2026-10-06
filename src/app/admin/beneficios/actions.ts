"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/supabase/require-admin";
import { BeneficioRepository } from "@/lib/repositories/BeneficioRepository";
import { beneficioSchema, validarLogo } from "@/lib/validations/beneficio";
import {
  borrarLogoDeStorage,
  resolverCambioLogo,
  subirLogoBeneficio,
} from "@/lib/storage/beneficios";

type Resultado = { success: boolean; error?: string };

function revalidarBeneficios() {
  revalidatePath("/admin/beneficios");
  revalidatePath("/kineclub");
  revalidatePath("/");
}

function mensaje(error: unknown): string {
  return error instanceof Error ? error.message : "Error inesperado.";
}

/** Lee y valida los campos comunes del FormData. Devuelve datos o un mensaje de error. */
function leerFormulario(formData: FormData) {
  const parsed = beneficioSchema.safeParse({
    empresa: formData.get("empresa"),
    descripcion: formData.get("descripcion"),
    descuento: formData.get("descuento"),
    categoriaId: formData.get("categoriaId"),
    enlace: formData.get("enlace"),
    logo_url_externa: formData.get("logo_url_externa"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const entry = formData.get("logo");
  const archivo = entry instanceof File && entry.size > 0 ? entry : null;
  if (archivo) {
    const errorLogo = validarLogo(archivo);
    if (errorLogo) return { error: errorLogo };
  }
  return { data: parsed.data, archivo, quitar: formData.get("quitar_logo") === "on" };
}

export async function crearBeneficio(formData: FormData): Promise<Resultado> {
  await requireAdmin();
  const leido = leerFormulario(formData);
  if ("error" in leido) return { success: false, error: leido.error };
  const { data, archivo } = leido;

  let subida: string | null = null;
  try {
    if (archivo) subida = await subirLogoBeneficio(archivo);
    const { logo_url } = resolverCambioLogo({
      actual: null,
      subida,
      urlPegada: data.logo_url_externa,
      quitar: false,
    });

    await BeneficioRepository.create({
      empresa: data.empresa,
      descripcion: data.descripcion,
      descuento: data.descuento,
      categoriaId: data.categoriaId,
      logo_url,
      url: data.enlace,
    });

    revalidarBeneficios();
    return { success: true };
  } catch (error: unknown) {
    await borrarLogoDeStorage(subida);
    return { success: false, error: mensaje(error) };
  }
}

export async function actualizarBeneficio(id: string, formData: FormData): Promise<Resultado> {
  await requireAdmin();
  const leido = leerFormulario(formData);
  if ("error" in leido) return { success: false, error: leido.error };
  const { data, archivo, quitar } = leido;

  let subida: string | null = null;
  try {
    const existente = await BeneficioRepository.getById(id);
    if (!existente) return { success: false, error: "Beneficio no encontrado." };

    if (archivo) subida = await subirLogoBeneficio(archivo);
    const { logo_url, aBorrar } = resolverCambioLogo({
      actual: existente.logo_url,
      subida,
      urlPegada: data.logo_url_externa,
      quitar,
    });

    await BeneficioRepository.update(id, {
      empresa: data.empresa,
      descripcion: data.descripcion,
      descuento: data.descuento,
      categoriaId: data.categoriaId,
      logo_url,
      url: data.enlace,
    });

    await borrarLogoDeStorage(aBorrar);
    revalidarBeneficios();
    return { success: true };
  } catch (error: unknown) {
    await borrarLogoDeStorage(subida);
    return { success: false, error: mensaje(error) };
  }
}

export async function eliminarBeneficio(id: string): Promise<Resultado> {
  await requireAdmin();
  try {
    const existente = await BeneficioRepository.getById(id);
    await BeneficioRepository.delete(id);
    await borrarLogoDeStorage(existente?.logo_url ?? null);
    revalidarBeneficios();
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: mensaje(error) };
  }
}

export async function eliminarBeneficioAction(id: string): Promise<void> {
  await eliminarBeneficio(id);
}
