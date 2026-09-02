import { z } from "zod";

/** Límite de tamaño por archivo individual (10 MB). */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Límite de tamaño acumulado de todos los documentos de una solicitud (40 MB). */
export const MAX_TOTAL_SIZE = 40 * 1024 * 1024;

/** Tipos MIME aceptados para los documentos de la solicitud. */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

/** Extensiones aceptadas para el nombre de objeto en Storage (allowlist). */
export const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp", "heic"] as const;

/** Documentos obligatorios. Idéntico al flujo actual — no cambia con este change. */
export const ARCHIVOS_REQUERIDOS = ["dni", "titulo", "cuit", "seguro", "cv", "matricula_file"] as const;

/** Documentos opcionales. Idéntico al flujo actual — no cambia con este change. */
export const ARCHIVOS_OPCIONALES = ["super_salud", "habilitacion"] as const;

/** Esquema de un ítem del manifiesto de archivos declarado por el cliente. */
export const manifiestoArchivoSchema = z.object({
  key: z.enum([...ARCHIVOS_REQUERIDOS, ...ARCHIVOS_OPCIONALES]),
  nombre: z.string().min(1, "El nombre del archivo es obligatorio.").max(255),
  tamano: z
    .number()
    .int()
    .positive("El tamaño del archivo debe ser mayor a 0.")
    .max(MAX_FILE_SIZE, `El archivo supera el tamaño máximo permitido de ${MAX_FILE_SIZE} bytes.`),
  tipo: z.enum(ALLOWED_MIME_TYPES, { error: "Tipo de archivo no permitido." }),
});

/** Campos de texto compartidos entre ambos schemas del flujo de registro. */
const camposTextoSchema = {
  nombre: z.string().min(1, "El nombre es obligatorio."),
  apellido: z.string().min(1, "El apellido es obligatorio."),
  email: z.string().email("El email no es válido."),
  matricula: z
    .string()
    .min(1, "La matrícula es obligatoria.")
    .regex(/^[a-zA-Z0-9_-]+$/, "La matrícula contiene caracteres no permitidos."),
  dni: z.string().min(1, "El DNI/CUIL es obligatorio."),
  telefono: z.string().min(1, "El teléfono es obligatorio."),
};

/**
 * Valida el payload de `prepararSubidaSolicitud`: campos de texto + manifiesto.
 * Además de la validación estructural, exige que estén presentes los 6 documentos
 * obligatorios y que la suma de tamaños no supere `MAX_TOTAL_SIZE`.
 */
export const prepararSubidaSchema = z
  .object({
    ...camposTextoSchema,
    manifiesto: z.array(manifiestoArchivoSchema).min(1, "Debe incluir al menos un documento."),
  })
  .superRefine((data, ctx) => {
    const keysPresentes = new Set(data.manifiesto.map((item) => item.key));

    for (const requerido of ARCHIVOS_REQUERIDOS) {
      if (!keysPresentes.has(requerido)) {
        ctx.addIssue({
          code: "custom",
          message: `El documento "${requerido}" es obligatorio.`,
          path: ["manifiesto"],
        });
      }
    }

    const tamanoTotal = data.manifiesto.reduce((acumulado, item) => acumulado + item.tamano, 0);
    if (tamanoTotal > MAX_TOTAL_SIZE) {
      ctx.addIssue({
        code: "custom",
        message: `El tamaño total de los documentos supera el máximo permitido de ${MAX_TOTAL_SIZE} bytes.`,
        path: ["manifiesto"],
      });
    }
  });

/** Valida el payload de `crearSolicitud`: campos de texto + mapa de paths ya subidos. Sin binarios. */
export const crearSolicitudSchema = z.object({
  ...camposTextoSchema,
  direccion: z.string().min(1, "La dirección es obligatoria."),
  localidadId: z.string().min(1, "La localidad es obligatoria."),
  especialidades: z
    .array(z.string().min(1))
    .min(1, "Tenés que elegir al menos una especialidad."),
  archivos: z.record(z.string(), z.string()),
});

/**
 * Sanea un segmento de path (matrícula o key) contra una allowlist de caracteres.
 * Rechaza cualquier intento de path traversal (`..`, `/`) o inyección de caracteres especiales.
 */
function sanitizarSegmentoPath(valor: string, etiqueta: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(valor)) {
    throw new Error(`${etiqueta} contiene caracteres no permitidos: "${valor}".`);
  }
  return valor;
}

/**
 * Extrae y valida la extensión de un nombre de archivo original contra `ALLOWED_EXTENSIONS`.
 * Sólo la extensión sobrevive al path final: cualquier intento de path traversal dentro del
 * nombre original queda descartado porque nunca se usa el nombre completo, sólo esta extensión.
 */
function extraerExtensionPermitida(nombreOriginal: string): string {
  const partes = nombreOriginal.split(".");
  const ext = (partes.length > 1 ? partes[partes.length - 1]! : "").toLowerCase();

  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new Error(`Extensión de archivo no permitida: "${nombreOriginal}".`);
  }

  return ext;
}

/**
 * Construye el path del objeto en Storage: `${matricula}-${key}-${timestamp}.${ext}`.
 * El servidor es la única autoridad sobre el path — el cliente nunca lo propone.
 * Rechaza extensiones desconocidas y cualquier intento de path traversal en matrícula, key o nombre.
 */
export function construirPathArchivo(matricula: string, key: string, nombreOriginal: string): string {
  const matriculaSegura = sanitizarSegmentoPath(matricula, "La matrícula");
  const keySegura = sanitizarSegmentoPath(key, "La clave de documento");
  const ext = extraerExtensionPermitida(nombreOriginal);

  return `${matriculaSegura}-${keySegura}-${Date.now()}.${ext}`;
}
