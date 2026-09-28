import { z } from "zod";

/** Límite de tamaño del CV (5 MB — `design.md — D4`, `tasks.md — 2.5`). */
export const MAX_CV_SIZE = 5 * 1024 * 1024;

/** Tipos MIME aceptados para el CV. */
export const ALLOWED_CV_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

/** Extensiones aceptadas para el nombre de objeto en Storage (allowlist). */
export const ALLOWED_CV_EXTENSIONS = ["pdf", "doc", "docx"] as const;

/**
 * Campo honeypot compartido por los dos formularios de alta (`design.md — D9`).
 * Se oculta con CSS en el cliente; si llega con contenido, la Server Action
 * responde `{ success: true }` sin persistir nada, para que el bot crea que
 * funcionó.
 */
export const HONEYPOT_FIELD = "sitioWeb";

const honeypotShape = { [HONEYPOT_FIELD]: z.string().optional().default("") };

/**
 * `FormData` sólo transporta strings: un checkbox tildado llega como
 * `"true"` (o `"on"` según el `value` del input), y uno destildado no llega
 * en absoluto (`undefined`). Este preprocesador normaliza ambos casos a
 * booleano ANTES de que `z.literal(true)` decida — así el checkbox
 * destildado sigue fallando en el servidor tal como pide `design.md — D9`,
 * en vez de comparar la literal `true` contra el string `"true"` y fallar
 * siempre por accidente.
 */
const aceptaDifusionSchema = z.preprocess(
  (valor) => valor === "true" || valor === "on" || valor === true,
  z.literal(true, { error: "Tenés que aceptar la difusión de tus datos para publicar el aviso." }),
);

/**
 * Valida el `File` del CV cuando está presente. El campo es opcional
 * (`cvPath` es nullable en el schema): no todo kinesiólogo tiene el CV a
 * mano al momento de publicar.
 */
export const cvFileSchema = z
  .instanceof(File, { error: "El CV no es un archivo válido." })
  .refine((archivo) => archivo.size > 0, "El CV está vacío.")
  .refine(
    (archivo) => archivo.size <= MAX_CV_SIZE,
    `El CV supera el tamaño máximo permitido de ${MAX_CV_SIZE} bytes.`,
  )
  .refine(
    (archivo) => (ALLOWED_CV_MIME_TYPES as readonly string[]).includes(archivo.type),
    "El CV debe ser PDF, DOC o DOCX.",
  );

/** Esquema de alta del aviso "Busco trabajo" (kinesiólogo). El CV se valida aparte con `cvFileSchema`. */
export const crearAvisoBuscoTrabajoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(100),
  apellido: z.string().trim().min(1, "El apellido es obligatorio.").max(100),
  matricula: z.string().trim().min(1, "La matrícula es obligatoria.").max(50),
  telefono: z.string().trim().min(1, "El teléfono es obligatorio.").max(30),
  email: z.string().trim().toLowerCase().email("El email no es válido.").max(200),
  especialidadId: z.string().min(1, "La especialidad es obligatoria."),
  localidadId: z.string().min(1, "La localidad es obligatoria."),
  zona: z.string().trim().max(100).optional().default(""),
  disponibilidad: z.string().trim().min(1, "Contanos tu disponibilidad.").max(300),
  presentacion: z.string().trim().min(1, "Contanos brevemente tu perfil.").max(2000),
  // Checkbox destildado (que no manda el campo) falla acá, en el servidor,
  // no sólo en el navegador (design.md — D9).
  aceptaDifusion: aceptaDifusionSchema,
  ...honeypotShape,
});

export type CrearAvisoBuscoTrabajoInput = z.infer<typeof crearAvisoBuscoTrabajoSchema>;

/** Esquema de alta del aviso "Busco kinesiólogo" (institución). */
export const crearAvisoBuscoKinesiologoSchema = z.object({
  institucion: z.string().trim().min(1, "La institución es obligatoria.").max(150),
  localidadId: z.string().min(1, "La localidad es obligatoria."),
  zona: z.string().trim().max(100).optional().default(""),
  area: z.string().trim().min(1, "El área de trabajo es obligatoria.").max(150),
  tipoPuesto: z.string().trim().min(1, "El tipo de puesto es obligatorio.").max(150),
  diasHorarios: z.string().trim().min(1, "Los días y horarios son obligatorios.").max(300),
  requisitos: z.string().trim().min(1, "Los requisitos son obligatorios.").max(2000),
  modalidad: z.string().trim().min(1, "La modalidad es obligatoria.").max(150),
  propuesta: z.string().trim().min(1, "Contanos la propuesta.").max(2000),
  medioContacto: z.string().trim().min(1, "El medio de contacto es obligatorio.").max(200),
  // "" (sin fecha límite) o una fecha ISO válida del <input type="date"> nativo.
  fechaLimite: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((valor) => valor === "" || !Number.isNaN(Date.parse(valor)), "La fecha límite no es válida."),
  aceptaDifusion: aceptaDifusionSchema,
  ...honeypotShape,
});

export type CrearAvisoBuscoKinesiologoInput = z.infer<typeof crearAvisoBuscoKinesiologoSchema>;
