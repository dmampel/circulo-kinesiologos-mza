import { z } from "zod";

export const SorteoSchema = z.object({
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  imagen_url: z.string().url("URL de imagen inválida").optional(),
  fechaInicio: z.coerce.date({ error: "Fecha de inicio inválida" }),
  fechaCierre: z.coerce.date({ error: "Fecha de cierre inválida" }).optional(),
  maxParticipantes: z.coerce.number().int().positive("Debe ser un número positivo").optional(),
});

export type SorteoFormState = {
  success: boolean;
  errors?: Partial<Record<keyof z.infer<typeof SorteoSchema>, string[]>>;
} | null;
