import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { construirFicha, type DocumentoFicha } from "@/lib/solicitudes/ficha";
import { normalizarEspecialidadesSolicitud } from "@/lib/especialidades";
import BotonImprimir from "./BotonImprimir";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

/** Par etiqueta/valor de la ficha. Se imprime en negro sobre blanco. */
function Campo({ label, valor, className }: { label: string; valor: string; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 print:text-slate-500">
        {label}
      </p>
      <p className="font-bold text-slate-900 break-words">{valor}</p>
    </div>
  );
}

/**
 * Bloque de documentación. Cada ítem declara su estado en palabras
 * ("Presentado" / "No presentado") en vez de depender de una casilla o un
 * color: la ficha se imprime en blanco y negro y tiene que leerse sin
 * interpretar símbolos.
 */
function GrupoDocumentos({
  titulo,
  documentos,
  className,
}: {
  titulo: string;
  documentos: DocumentoFicha[];
  className?: string;
}) {
  if (documentos.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
        Documentación {titulo}
      </h3>
      <ul>
        {documentos.map((doc) => (
          <li
            key={doc.id}
            className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2"
          >
            <span className="text-sm font-bold text-slate-900">{doc.label}</span>
            <span
              className={cn(
                "shrink-0 text-[10px] font-black uppercase tracking-widest",
                doc.adjuntado ? "text-slate-900" : "text-red-600"
              )}
            >
              {doc.adjuntado ? "Presentado" : "No presentado"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function FichaSolicitudPage({ params }: Props) {
  const { id } = await params;
  const solicitud = await prisma.solicitud.findUnique({ where: { id } });

  if (!solicitud) notFound();

  const datos = solicitud.datos as Record<string, unknown> | null;

  // Los nombres de localidad y especialidades se resuelven acá; `construirFicha`
  // es pura y sólo formatea lo que se le pasa.
  const declaradas = normalizarEspecialidadesSolicitud(datos);
  const [localidad, especialidades] = await Promise.all([
    typeof datos?.localidadId === "string"
      ? prisma.localidad.findUnique({
          where: { id: datos.localidadId },
          select: { nombre: true },
        })
      : null,
    declaradas.length
      ? prisma.especialidad.findMany({
          where: { OR: [{ id: { in: declaradas } }, { nombre: { in: declaradas } }] },
          select: { nombre: true },
          orderBy: { nombre: "asc" },
        })
      : [],
  ]);

  const ficha = construirFicha(solicitud, {
    localidad: localidad?.nombre ?? "",
    especialidades: especialidades.map((e) => e.nombre),
  });

  const obligatorios = ficha.documentos.filter((doc) => doc.obligatorio);
  const opcionales = ficha.documentos.filter((doc) => !doc.obligatorio);
  const presentados = ficha.documentos.filter((doc) => doc.adjuntado);
  const noPresentados = ficha.documentos.filter((doc) => !doc.adjuntado);

  const emitidaEl = new Date().toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 print:max-w-none print:space-y-0">
      {/* Barra de acciones — no forma parte del documento impreso. */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link
          href={`/admin/solicitudes/${solicitud.id}`}
          className="flex h-12 items-center gap-2 rounded-2xl border border-slate-100 bg-white px-5 text-sm font-bold text-slate-500 transition-all hover:text-slate-900 hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a la solicitud
        </Link>
        <BotonImprimir />
      </div>

      {/* Documento */}
      <article className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-slate-900 pb-6">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="Círculo de Kinesiólogos de Mendoza"
              width={120}
              height={40}
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-black leading-tight text-slate-900">
                Ficha de Solicitud de Ingreso
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Círculo de Kinesiólogos de Mendoza
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</p>
            <p className="text-lg font-black text-slate-900">{ficha.estado}</p>
          </div>
        </header>

        <section className="pt-8">
          <h2 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Datos del Profesional
          </h2>
          <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
            <Campo label="Apellido y Nombre" valor={ficha.apellidoNombre} />
            <Campo label="Matrícula Profesional" valor={`M.P. ${ficha.matricula}`} />
            <Campo label="DNI / CUIL" valor={ficha.dni} />
            <Campo label="Teléfono" valor={ficha.telefono} />
            <Campo label="Email" valor={ficha.email} />
            <Campo label="Localidad" valor={ficha.localidad} />
            <Campo label="Dirección de Consultorio" valor={ficha.direccion} className="md:col-span-2" />
            <Campo label="Especialidades" valor={ficha.especialidades} className="md:col-span-2" />
          </div>
        </section>

        <section className="pt-10">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Documentación
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {presentados.length} de {ficha.documentos.length} presentados
            </span>
          </div>

          <GrupoDocumentos titulo="Obligatoria" documentos={obligatorios} />
          <GrupoDocumentos titulo="Opcional" documentos={opcionales} className="mt-8" />

          {/* El resumen se repite en texto corrido: es lo que se lee de un
              vistazo cuando la ficha llega impresa a administración. */}
          <div className="mt-8 space-y-2 border-t border-slate-200 pt-6 text-sm">
            <p className="font-bold text-slate-900">
              <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                Presentó:{" "}
              </span>
              {presentados.length > 0
                ? presentados.map((doc) => doc.label).join(", ")
                : "Ningún documento."}
            </p>
            <p className="font-bold text-slate-900">
              <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                No presentó:{" "}
              </span>
              {noPresentados.length > 0
                ? noPresentados
                    .map((doc) => (doc.obligatorio ? doc.label : `${doc.label} (opcional)`))
                    .join(", ")
                : "Nada pendiente. Presentó toda la documentación."}
            </p>
          </div>

          {!ficha.documentacionCompleta && (
            <p className="mt-6 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 print:bg-transparent">
              Falta documentación obligatoria: {ficha.faltantes.join(", ")}.
            </p>
          )}
        </section>

        <footer className="mt-12 space-y-1 border-t border-slate-200 pt-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <p>
            Solicitud recibida el{" "}
            {new Date(ficha.creadaEn).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          {ficha.revisadaEn && (
            <p>Revisada el {new Date(ficha.revisadaEn).toLocaleDateString("es-AR")}</p>
          )}
          <p>Ficha emitida el {emitidaEl}</p>
          <p className="pt-2 normal-case tracking-normal text-slate-400">
            Documento informativo. No constituye constancia ni certificación.
          </p>
        </footer>
      </article>
    </div>
  );
}
