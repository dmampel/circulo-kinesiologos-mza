/**
 * Armado de la "ficha" de una solicitud de ingreso: la vista consolidada que
 * el admin exporta e imprime para enviar a administración.
 *
 * Es deliberadamente pura — recibe el registro de `Solicitud` más los nombres
 * ya resueltos de localidad y especialidades, y devuelve texto listo para
 * renderizar. Toda la lectura del snapshot `datos` (que es Json y puede venir
 * incompleto o nulo en solicitudes viejas) queda contenida acá.
 */

import { ARCHIVOS_REQUERIDOS, ARCHIVOS_OPCIONALES } from "@/lib/validations/solicitud";

/** Marcador único para todo dato ausente, así la ficha impresa no tiene huecos. */
const SIN_DATO = "No especificado";

/**
 * Catálogo de documentación de una solicitud, en el orden en que se muestra.
 * Fuente única compartida por la pantalla de detalle y la ficha exportable.
 */
export const DOCUMENTOS_SOLICITUD = [
  { id: "dni", label: "Fotocopia DNI" },
  { id: "titulo", label: "Título Universitario" },
  { id: "cuit", label: "Constancia CUIT/IIBB" },
  { id: "seguro", label: "Póliza Mala Praxis" },
  { id: "cv", label: "Curriculum Vitae" },
  { id: "matricula_file", label: "Matrícula Provincial" },
  { id: "super_salud", label: "Superintendencia de Salud" },
  { id: "habilitacion", label: "Habilitación Consultorio" },
] as const satisfies ReadonlyArray<{ id: string; label: string }>;

const OBLIGATORIOS = new Set<string>(ARCHIVOS_REQUERIDOS);
const OPCIONALES = new Set<string>(ARCHIVOS_OPCIONALES);

export type DocumentoFicha = {
  id: string;
  label: string;
  obligatorio: boolean;
  adjuntado: boolean;
};

export type FichaSolicitud = {
  id: string;
  apellidoNombre: string;
  email: string;
  matricula: string;
  dni: string;
  telefono: string;
  direccion: string;
  localidad: string;
  especialidades: string;
  estado: string;
  creadaEn: Date;
  revisadaEn: Date | null;
  documentos: DocumentoFicha[];
  /** Labels de los documentos obligatorios que no fueron adjuntados. */
  faltantes: string[];
  documentacionCompleta: boolean;
};

/** Forma mínima del registro `Solicitud` que necesita la ficha. */
type SolicitudFicha = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  matricula: string;
  status: string;
  creada_en: Date;
  revisada_en: Date | null;
  datos: unknown;
};

type NombresResueltos = {
  /** Nombre de la localidad ya resuelto desde `datos.localidadId`. */
  localidad: string;
  /** Nombres de especialidades ya resueltos desde `datos.especialidades`. */
  especialidades: string[];
};

/** Devuelve el string si tiene contenido; si no, el marcador de dato ausente. */
function oSinDato(valor: unknown): string {
  return typeof valor === "string" && valor.trim().length > 0 ? valor.trim() : SIN_DATO;
}

export function construirFicha(
  solicitud: SolicitudFicha,
  { localidad, especialidades }: NombresResueltos
): FichaSolicitud {
  const datos = (solicitud.datos ?? {}) as Record<string, unknown>;
  const archivos = (datos.archivos ?? {}) as Record<string, unknown>;

  const documentos: DocumentoFicha[] = DOCUMENTOS_SOLICITUD.map((doc) => ({
    id: doc.id,
    label: doc.label,
    obligatorio: OBLIGATORIOS.has(doc.id),
    adjuntado: Boolean(archivos[doc.id]),
  }));

  const faltantes = documentos
    .filter((doc) => doc.obligatorio && !doc.adjuntado)
    .map((doc) => doc.label);

  return {
    id: solicitud.id,
    apellidoNombre: `${solicitud.apellido}, ${solicitud.nombre}`,
    email: solicitud.email,
    matricula: solicitud.matricula,
    dni: oSinDato(datos.dni),
    telefono: oSinDato(datos.telefono),
    direccion: oSinDato(datos.direccion),
    localidad: oSinDato(localidad),
    especialidades: especialidades.length > 0 ? especialidades.join(", ") : "Sin especialidad",
    estado: solicitud.status,
    creadaEn: solicitud.creada_en,
    revisadaEn: solicitud.revisada_en,
    documentos,
    faltantes,
    documentacionCompleta: faltantes.length === 0,
  };
}

/** Los opcionales existen en el catálogo pero nunca condicionan la completitud. */
export const DOCUMENTOS_OPCIONALES = OPCIONALES;
