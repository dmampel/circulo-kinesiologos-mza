import { z } from "zod";
import type { ArchivoLike } from "./archivoCliente";

export const ALLOWED_LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"] as const;

/** 2 MB. SVG queda afuera a propósito (XSS en bucket público). */
export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

const vacioANull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

export const beneficioSchema = z.object({
  empresa: z.string().trim().min(1, "La empresa es requerida"),
  descripcion: z.string().trim().min(1, "La descripción es requerida"),
  descuento: z.string().trim().min(1, "El descuento es requerido"),
  categoriaId: z.string().min(1, "La categoría es requerida"),
  enlace: z.preprocess(vacioANull, z.url("El enlace no es una URL válida").nullable()),
  logo_url_externa: z.preprocess(
    vacioANull,
    z
      .url("La URL del logo no es válida")
      .refine((u) => u.startsWith("https://"), "La URL del logo debe empezar con https://")
      .nullable()
  ),
});

export type BeneficioInput = z.infer<typeof beneficioSchema>;

/** Valida el archivo de logo. Devuelve el mensaje de error o `null` si es válido. */
export function validarLogo(file: ArchivoLike): string | null {
  if (!(ALLOWED_LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Formato no permitido. Usá PNG, JPEG, WEBP o AVIF.";
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return "El logo supera el tamaño máximo de 2 MB";
  }
  return null;
}
