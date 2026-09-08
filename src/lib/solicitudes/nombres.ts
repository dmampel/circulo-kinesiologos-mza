/**
 * Resolución compartida de `localidadId` + IDs/nombres de especialidad a texto
 * legible para los avisos institucionales (el automático del registro y el
 * reenvío manual desde el admin).
 *
 * Existe como módulo propio, y no como parte de `src/lib/especialidades.ts`,
 * porque ese módulo es deliberadamente puro (sin I/O) y éste necesita Prisma
 * para resolver contra los catálogos de `Localidad` y `Especialidad`. Mezclar
 * ambas cosas arrastraría la base de datos a los tests de un módulo que hoy
 * es trivial de testear sin mocks.
 *
 * Es la única fuente de verdad de esta resolución: antes vivía inline en
 * `crearSolicitud` (`src/app/registro/actions.ts`); el reenvío la necesita
 * igual y no puede importarla de ahí porque ese archivo es `"use server"` —
 * cada export se vuelve un endpoint HTTP.
 */

import prisma from "@/lib/prisma";
import { normalizarEspecialidadesSolicitud } from "@/lib/especialidades";

/** Marcador único para localidad no resuelta. Nunca se devuelve un ID. */
export const SIN_LOCALIDAD = "No especificada";

export type NombresSolicitud = {
  localidad: string;
  especialidades: string;
};

/** Forma mínima del JSON `Solicitud.datos` en lo que respecta a localidad. */
type DatosSolicitud = {
  localidadId?: unknown;
};

/**
 * Resuelve `localidadId` + especialidades (formato nuevo o viejo, por ID o
 * por nombre) a texto legible para un aviso institucional. Nunca lanza: ante
 * cualquier fallo o falta de resultados devuelve los defaults
 * (`SIN_LOCALIDAD` para localidad, el join de los valores declarados —o
 * cadena vacía— para especialidades). Nunca devuelve un identificador.
 */
export async function resolverNombresSolicitud(datos: unknown): Promise<NombresSolicitud> {
  const { localidadId } = (datos ?? {}) as DatosSolicitud;
  const idLocalidad = typeof localidadId === "string" ? localidadId : undefined;
  const valoresEspecialidad = normalizarEspecialidadesSolicitud(datos);

  let localidad = SIN_LOCALIDAD;
  let especialidades = valoresEspecialidad.join(", ");

  try {
    const [especialidadRegistros, localidadRegistro] = await Promise.all([
      valoresEspecialidad.length > 0
        ? prisma.especialidad.findMany({
            where: { OR: [{ id: { in: valoresEspecialidad } }, { nombre: { in: valoresEspecialidad } }] },
            select: { nombre: true },
            orderBy: { nombre: "asc" },
          })
        : Promise.resolve([]),
      idLocalidad
        ? prisma.localidad.findUnique({ where: { id: idLocalidad }, select: { nombre: true } })
        : Promise.resolve(null),
    ]);

    if (especialidadRegistros.length > 0) {
      especialidades = especialidadRegistros.map((especialidad) => especialidad.nombre).join(", ");
    }
    if (localidadRegistro) {
      localidad = localidadRegistro.nombre;
    }
  } catch {
    // best-effort: si Prisma falla, se usan los defaults ya calculados arriba
  }

  return { localidad, especialidades };
}
