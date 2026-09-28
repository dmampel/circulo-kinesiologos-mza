import { z } from "zod";

export const profesionalSearchSchema = z.object({
  q: z.string().optional().default(""),
  loc: z.string().optional().default(""),
  spec: z.string().optional().default(""),
  char: z.string().optional().default(""),
  page: z.coerce.number().int().positive().default(1),
});

export type ProfesionalSearchParams = z.infer<typeof profesionalSearchSchema>;

export const kineClubSearchSchema = z.object({
  cat: z.string().optional().default("TODOS"),
});

export type KineClubSearchParams = z.infer<typeof kineClubSearchSchema>;

export const bolsaSearchSchema = z.object({
  tipo: z.enum(["busco-trabajo", "busco-kinesiologo"]).optional().default("busco-trabajo"),
  q: z.string().optional().default(""),
  loc: z.string().optional().default(""),
  spec: z.string().optional().default(""),
  puesto: z.string().optional().default(""),
  page: z.coerce.number().int().positive().default(1),
});

export type BolsaSearchParams = z.infer<typeof bolsaSearchSchema>;
