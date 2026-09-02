/**
 * Helpers de especialidades compartidos entre el registro público y la aprobación
 * de solicitudes en el admin.
 *
 * Contexto: hasta esta versión el formulario público guardaba UNA sola especialidad
 * en `Solicitud.datos.especialidad` (el ID elegido en el select). El formato nuevo
 * guarda un array de IDs en `Solicitud.datos.especialidades`. Las solicitudes
 * PENDIENTES creadas antes del cambio siguen teniendo el campo viejo, así que toda
 * lectura pasa por `normalizarEspecialidadesSolicitud`.
 */

/** Forma mínima del JSON `Solicitud.datos` en lo que respecta a especialidades. */
type DatosSolicitud = {
  especialidades?: unknown;
  especialidad?: unknown;
};

/**
 * Devuelve la lista de especialidades declaradas en una solicitud, sin importar si
 * fue creada con el formato nuevo (`especialidades: string[]`) o con el viejo
 * (`especialidad: string`). Descarta vacíos, duplicados y valores no string.
 */
export function normalizarEspecialidadesSolicitud(datos: unknown): string[] {
  const { especialidades, especialidad } = (datos ?? {}) as DatosSolicitud;

  const crudas = Array.isArray(especialidades)
    ? especialidades
    : especialidad !== undefined
      ? [especialidad]
      : [];

  const limpias = crudas
    .filter((valor): valor is string => typeof valor === "string")
    .map((valor) => valor.trim())
    .filter((valor) => valor.length > 0);

  return [...new Set(limpias)];
}

/**
 * Detecta si un valor es un identificador generado (cuid de Prisma) y no el nombre
 * de una especialidad.
 *
 * Existe por un bug real: `gestionarSolicitud` hacía `connectOrCreate` por `nombre`
 * usando el ID que mandaba el formulario, así que cada aprobación creaba una
 * `Especialidad` llamada como un cuid. Este guard impide volver a crear esa basura.
 */
export function esIdGenerado(valor: string): boolean {
  return /^c[a-z0-9]{20,}$/.test(valor);
}
