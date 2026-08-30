import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Filtro de /profesionales: casi-estático (sólo cambia si se toca la tabla de
// localidades, cosa que hoy no ocurre desde ningún admin). Cacheado con tag
// "localidades" para invalidación on-demand si en el futuro se agrega un CRUD.
const getCachedLocalidades = unstable_cache(
  async () => prisma.localidad.findMany({ orderBy: { nombre: "asc" } }),
  ["localidades-all"],
  { tags: ["localidades"], revalidate: 3600 },
);

export class LocalidadRepository {
  static async getAll() {
    return getCachedLocalidades();
  }
}
