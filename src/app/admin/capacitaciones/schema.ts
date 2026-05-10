import { z } from "zod";

export const CapacitacionSchema = z.object({
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  tipo: z.enum(["CURSO", "TALLER", "CONGRESO", "ASAMBLEA"], {
    error: "Tipo inválido",
  }),
  modalidad: z.enum(["PRESENCIAL", "VIRTUAL", "HIBRIDO"], {
    error: "Modalidad inválida",
  }),
  fechaInicio: z.coerce.date({ error: "Fecha de inicio inválida" }),
  fechaFin: z.coerce.date({ error: "Fecha de fin inválida" }).optional(),
  ubicacion: z.string().optional(),
  cupoMaximo: z.coerce.number().int().positive("El cupo debe ser un número positivo").optional(),
  costo: z.coerce.number().nonnegative("El costo no puede ser negativo").optional(),
  publicada: z.boolean().default(false),
});

export type CapacitacionFormState = {
  success: boolean;
  errors?: Partial<Record<keyof z.infer<typeof CapacitacionSchema>, string[]>>;
} | null;
