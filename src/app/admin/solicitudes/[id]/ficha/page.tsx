import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { construirFicha } from "@/lib/solicitudes/ficha";
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
              Documentación Presentada
            </h2>
            <span
              className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                ficha.documentacionCompleta ? "text-green-600" : "text-red-600"
              )}
            >
              {ficha.documentacionCompleta ? "Completa" : `Faltan ${ficha.faltantes.length}`}
            </span>
          </div>

          <ul className="grid grid-cols-1 gap-x-12 gap-y-3 md:grid-cols-2">
            {ficha.documentos.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 border-b border-slate-100 pb-2">
                {/* Casilla dibujada con borde: sobrevive a la impresión en B/N,
                    a diferencia de un ícono de color o un fondo. */}
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center border border-slate-900 text-[11px] font-black leading-none text-slate-900"
                  aria-hidden
                >
                  {doc.adjuntado ? "X" : ""}
                </span>
                <span className="text-sm font-bold text-slate-900">{doc.label}</span>
                {!doc.obligatorio && (
                  <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Opcional
                  </span>
                )}
              </li>
            ))}
          </ul>

          {!ficha.documentacionCompleta && (
            <p className="mt-6 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 print:bg-transparent">
              Documentación obligatoria faltante: {ficha.faltantes.join(", ")}.
            </p>
          )}
        </section>

        <footer className="mt-12 flex flex-wrap items-end justify-between gap-8 border-t border-slate-200 pt-6">
          <div className="space-y-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
          </div>

          <div className="w-64 border-t border-slate-900 pt-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
            Firma y sello
          </div>
        </footer>
      </article>
    </div>
  );
}
