import { z } from "zod";

/** MIME types aceptados para la subida de imágenes de noticias. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/** Límite de tamaño por archivo, por debajo de `serverActions.bodySizeLimit` (4 MB). */
export const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

export const imagenNoticiaSchema = z.object({
  url: z.url("URL de imagen inválida"),
  alt: z
    .string()
    .max(200, "El texto alternativo no puede superar los 200 caracteres")
    .optional()
    .nullable(),
});

export const imagenesNoticiaSchema = z.array(imagenNoticiaSchema).max(10, "Máximo 10 imágenes");

export const noticiaSchema = z.object({
  titulo: z.string().min(1, "El título es requerido").max(200),
  resumen: z.string().max(500).optional().nullable(),
  contenido: z.string().min(1, "El contenido es requerido"),
  categoriaId: z.string().optional().nullable(),
  publicada: z.boolean(),
  imagenes: imagenesNoticiaSchema,
});

export type ImagenNoticiaInput = z.infer<typeof imagenNoticiaSchema>;

/**
 * Deriva `Noticia.imagen_url` (cache) de la galería ordenada: la url de la
 * primera imagen, o `null` si la galería quedó vacía. Único punto de verdad
 * de esa derivación — lo usa `NoticiaRepository.replaceImagenes`.
 */
export function derivarImagenPortada(imagenes: { url: string }[]): string | null {
  return imagenes[0]?.url ?? null;
}

/**
 * Renumera la galería recibida a `orden` secuencial 0..N-1 según la posición
 * en el array (la fuente de verdad del orden es la posición, no un campo que
 * viaje en el payload).
 */
export function renumerarOrden<T extends { url: string; alt?: string | null }>(
  imagenes: T[]
): (T & { orden: number })[] {
  return imagenes.map((imagen, index) => ({ ...imagen, orden: index }));
}
