import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_TOTAL_SIZE } from "./solicitud";

/**
 * Forma mínima de un archivo que necesitan las validaciones de este módulo.
 * Un `File` del navegador cumple esta forma, pero al ser un tipo estructural
 * también permite testear estas funciones puras sin depender del DOM.
 */
export type ArchivoLike = {
  name: string;
  size: number;
  type: string;
};

/** Ítem del manifiesto que el cliente envía a `prepararSubidaSolicitud`. */
export type ManifiestoItem = {
  key: string;
  nombre: string;
  tamano: number;
  tipo: string;
};

const MAX_FILE_SIZE_MB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
const MAX_TOTAL_SIZE_MB = Math.round(MAX_TOTAL_SIZE / (1024 * 1024));

/**
 * Valida un archivo recién seleccionado por el usuario contra los límites de
 * tamaño y la allowlist de MIME, ANTES de guardarlo en el estado del formulario.
 * Devuelve el mensaje de error o `null` si el archivo es válido.
 */
export function validarArchivoCliente(file: ArchivoLike): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `El archivo supera el tamaño máximo permitido de ${MAX_FILE_SIZE_MB} MB.`;
  }

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Tipo de archivo no permitido. Formatos aceptados: PDF, JPG, PNG, WEBP, HEIC.";
  }

  return null;
}

/** Suma el tamaño de todos los archivos presentes en el estado, ignorando los `null`. */
export function calcularTamanoTotal(archivos: Record<string, ArchivoLike | null>): number {
  return Object.values(archivos).reduce((acumulado, archivo) => acumulado + (archivo?.size ?? 0), 0);
}

/**
 * Valida que la suma de tamaños de todos los archivos cargados no supere
 * `MAX_TOTAL_SIZE`. Devuelve el mensaje de aviso agregado o `null` si está OK.
 */
export function validarTamanoTotal(archivos: Record<string, ArchivoLike | null>): string | null {
  const total = calcularTamanoTotal(archivos);
  if (total > MAX_TOTAL_SIZE) {
    const totalMB = (total / (1024 * 1024)).toFixed(1);
    return `El tamaño total de los documentos (${totalMB} MB) supera el máximo permitido de ${MAX_TOTAL_SIZE_MB} MB.`;
  }
  return null;
}

/**
 * Construye el manifiesto de archivos que el cliente envía a
 * `prepararSubidaSolicitud`, a partir del estado `Record<key, File | null>`.
 * Sólo incluye las entradas con archivo presente.
 */
export function construirManifiesto(archivos: Record<string, ArchivoLike | null>): ManifiestoItem[] {
  return Object.entries(archivos)
    .filter((entrada): entrada is [string, ArchivoLike] => entrada[1] !== null)
    .map(([key, archivo]) => ({
      key,
      nombre: archivo.name,
      tamano: archivo.size,
      tipo: archivo.type,
    }));
}

/**
 * Convierte el array de `uploads` devuelto por `prepararSubidaSolicitud`
 * (`{ key, path, token }[]`) en el `Record<key, path>` que espera `crearSolicitud`.
 */
export function mapearPathsDesdeUploads(
  uploads: Array<{ key: string; path: string; token?: string }>
): Record<string, string> {
  return Object.fromEntries(uploads.map((upload) => [upload.key, upload.path]));
}
