import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, PlusCircle, X } from "lucide-react";
import { Suspense } from "react";
import { LocalidadRepository } from "@/lib/repositories/LocalidadRepository";
import { EspecialidadRepository } from "@/lib/repositories/EspecialidadRepository";
import { AvisoRepository } from "@/lib/repositories/AvisoRepository";
import { bolsaSearchSchema } from "@/lib/validations/searchParams";
import { construirUrlAbsoluta } from "@/lib/site";
import SearchInput from "@/components/atoms/SearchInput";
import FilterSelect from "@/components/atoms/FilterSelect";
import AclaracionLegal from "@/components/atoms/AclaracionLegal";
import TabsBolsa from "@/components/molecules/TabsBolsa";
import ListadoAvisos from "@/components/organisms/ListadoAvisos";
import WaveTransition from "@/components/WaveTransition";

export const metadata: Metadata = {
  title: "Bolsa de Trabajo | Círculo de Kinesiólogos de Mendoza",
  description:
    "Avisos de kinesiólogos que buscan trabajo e instituciones que buscan kinesiólogos en Mendoza. Publicación y contacto directo, sin intermediarios.",
  openGraph: {
    title: "Bolsa de Trabajo | CKM Mendoza",
    description: "Encontrá o publicá búsquedas laborales de kinesiología en Mendoza.",
    url: construirUrlAbsoluta("/bolsa-de-trabajo"),
  },
};

const PAGE_SIZE = 12;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BolsaDeTrabajoPage({ searchParams }: Props) {
  const params = bolsaSearchSchema.parse(await searchParams);
  const { tipo, q, loc, spec, puesto, page: currentPage } = params;

  const [localidades, especialidades, avisosTrabajo, avisosKinesiologo] = await Promise.all([
    LocalidadRepository.getAll(),
    EspecialidadRepository.getAll(),
    tipo === "busco-trabajo"
      ? AvisoRepository.findBuscoTrabajoPublicados(
          { query: q || undefined, localidadId: loc || undefined, especialidadId: spec || undefined },
          currentPage,
          PAGE_SIZE,
        )
      : null,
    tipo === "busco-kinesiologo"
      ? AvisoRepository.findBuscoKinesiologoPublicados(
          { localidadId: loc || undefined, tipoPuesto: puesto || q || undefined },
          currentPage,
          PAGE_SIZE,
        )
      : null,
  ]);

  const resultado = tipo === "busco-trabajo" ? avisosTrabajo! : avisosKinesiologo!;
  const totalPages = Math.ceil(resultado.total / PAGE_SIZE);
  const hasFilters = q || loc || spec || puesto;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero */}
      <div className="bg-slate-900 pt-20 pb-40 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-black tracking-widest uppercase mb-6 backdrop-blur-md">
            <Briefcase className="mr-2 h-3 w-3" /> Bolsa de Trabajo
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter">
            Bolsa de Trabajo{" "}
            <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">CKFM</span>
          </h1>

          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed mb-4 font-medium">
            Un espacio para conectar profesionales y oportunidades laborales.
          </p>
          <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed mb-4">
            Si sos kinesiólogo y estás buscando una oportunidad laboral o si necesitás incorporar un
            profesional a tu equipo, podés publicar tu búsqueda aquí.
          </p>
          <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed mb-8">
            El CKFM recibe y difunde las búsquedas para facilitar el encuentro entre profesionales y
            empleadores.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/bolsa-de-trabajo/publicar/busco-trabajo"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-blue-600 text-white font-black text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Busco trabajo
            </Link>
            <Link
              href="/bolsa-de-trabajo/publicar/busco-kinesiologo"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/30 text-white font-black text-sm hover:bg-white hover:text-slate-900 transition-all"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Busco kinesiólogo
            </Link>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600 rounded-full blur-[150px]" />
        </div>

        <WaveTransition color="text-slate-50" />
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 relative z-20">
        <div className="w-full flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <Suspense fallback={<div className="h-14 bg-slate-100 animate-pulse rounded-[2rem]" />}>
              <SearchInput defaultValue={tipo === "busco-trabajo" ? q : puesto || q} />
            </Suspense>
          </div>

          <Suspense fallback={<div className="h-14 w-full md:w-48 bg-slate-100 animate-pulse rounded-2xl shrink-0" />}>
            <div className="w-full md:w-48 shrink-0">
              <FilterSelect name="loc" defaultValue={loc} options={localidades} placeholder="Localidad" icon="loc" />
            </div>
            {tipo === "busco-trabajo" && (
              <div className="w-full md:w-48 shrink-0">
                <FilterSelect
                  name="spec"
                  defaultValue={spec}
                  options={especialidades}
                  placeholder="Especialidad"
                  icon="spec"
                />
              </div>
            )}
          </Suspense>

          {hasFilters && (
            <Link
              href={`/bolsa-de-trabajo?tipo=${tipo}`}
              className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-white/60 backdrop-blur-md border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm shrink-0"
            >
              <X className="mr-2 h-4 w-4" /> Limpiar
            </Link>
          )}
        </div>

        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">
                {tipo === "busco-trabajo" ? "Kinesiólogos que buscan trabajo" : "Instituciones que buscan kinesiólogos"}
              </h2>
              <p className="text-sm font-medium text-slate-400 mt-1">
                Mostrando {resultado.data.length} de {resultado.total} avisos
              </p>
            </div>

            <div className="shrink-0">
              <TabsBolsa basePath="/bolsa-de-trabajo" tipo={tipo} />
            </div>
          </div>

          {avisosTrabajo ? (
            <ListadoAvisos
              tipo="busco-trabajo"
              avisos={avisosTrabajo.data}
              totalPages={totalPages}
              currentPage={currentPage}
            />
          ) : (
            <ListadoAvisos
              tipo="busco-kinesiologo"
              avisos={avisosKinesiologo!.data}
              totalPages={totalPages}
              currentPage={currentPage}
            />
          )}
        </div>

        <div className="mt-8">
          <AclaracionLegal />
        </div>
      </div>
    </div>
  );
}
