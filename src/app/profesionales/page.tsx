import type { Metadata } from "next";
import { LocalidadRepository } from "@/lib/repositories/LocalidadRepository";
import { EspecialidadRepository } from "@/lib/repositories/EspecialidadRepository";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";

export const metadata: Metadata = {
  title: "Padrón de Profesionales | Círculo de Kinesiólogos de Mendoza",
  description: "Buscá kinesiólogos habilitados en Mendoza por nombre, localidad o especialidad. Directorio oficial del Círculo de Kinesiólogos.",
  openGraph: {
    title: "Padrón de Profesionales | CKM Mendoza",
    description: "Directorio oficial de kinesiólogos habilitados en la provincia de Mendoza.",
    url: "https://www.circulokinesiologos.com.ar/profesionales",
  },
};
import {
  Search,
  MapPin,
  Award,
  Phone,
  Calendar,
  ChevronRight,
  X,
  User,
} from "lucide-react";
import Link from "next/link";
import SearchInput from "@/components/atoms/SearchInput";
import FilterSelect from "@/components/atoms/FilterSelect";
import AlphabetSidebar from "@/components/molecules/AlphabetSidebar";
import Pagination from "@/components/molecules/Pagination";
import WaveTransition from "@/components/WaveTransition";
import { Suspense } from "react";

import { profesionalSearchSchema } from "@/lib/validations/searchParams";

const PAGE_SIZE = 24;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProfesionalesPage({ searchParams }: Props) {
  const params = profesionalSearchSchema.parse(await searchParams);
  const { q: query, loc: locId, spec: specId, char, page: currentPage } = params;

  // 1. Fetch de filtros, total y profesionales de forma paralela
  const [localidades, especialidades, { data: profesionales, total: totalCount }] =
    await Promise.all([
      LocalidadRepository.getAll(),
      EspecialidadRepository.getAll(),
      ProfesionalRepository.findPaginated(currentPage, PAGE_SIZE, {
        query,
        localidadId: locId,
        especialidadId: specId,
        char,
      }),
    ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasFilters = query || locId || specId || char;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 pt-20 pb-40 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-black tracking-widest uppercase mb-6 backdrop-blur-md">
            <User className="mr-2 h-3 w-3" /> Padrón Oficial
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-white mb-6 tracking-tighter">
            Encontrá tu <br />{" "}
            <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">
              Kinesiólogo
            </span>
          </h1>

          <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Accedé al listado completo de profesionales matriculados y
            habilitados por el Círculo de Kinesiólogos de la provincia.
          </p>
        </div>

        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600 rounded-full blur-[150px]" />
        </div>

        <WaveTransition color="text-slate-50" />
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
        {/* Controles de Búsqueda Flotantes sobre la Onda */}
        <div className="mb-8 max-w-5xl mx-auto">
          {/* ... SearchInput and filters ... */}
          <Suspense
            fallback={
              <div className="h-20 bg-white/5 animate-pulse rounded-[2rem] max-w-2xl mx-auto" />
            }
          >
            <SearchInput defaultValue={query} />
          </Suspense>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {/* ... FilterSelects ... */}
            <Suspense
              fallback={
                <div className="h-12 w-48 bg-white/5 animate-pulse rounded-2xl" />
              }
            >
              <div className="w-full sm:w-56">
                <FilterSelect
                  name="loc"
                  defaultValue={locId}
                  options={localidades}
                  placeholder="Localidad"
                  icon="loc"
                />
              </div>
              <div className="w-full sm:w-56">
                <FilterSelect
                  name="spec"
                  defaultValue={specId}
                  options={especialidades}
                  placeholder="Especialidad"
                  icon="spec"
                />
              </div>
            </Suspense>

            {hasFilters && (
              <Link
                href="/profesionales"
                className="inline-flex items-center px-6 py-3 rounded-2xl bg-white/60 backdrop-blur-md border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                <X className="mr-2 h-4 w-4" /> Limpiar
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] p-8 lg:p-12 border border-white shadow-xl shadow-slate-200/50">
          {/* Alphabet Navigation Horizontal */}
          <AlphabetSidebar selectedChar={char} />

          <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {char ? `Apellido con "${char}"` : "Todos los Profesionales"}
              </h2>
              <p className="text-sm font-medium text-slate-400 mt-1">
                Mostrando {profesionales.length} de {totalCount} profesionales
              </p>
            </div>
          </div>

          {profesionales.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No encontramos resultados
              </h3>
              <p className="text-slate-500">
                Probá ajustando los filtros o la búsqueda.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                {profesionales.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
                  >
                    <div className="flex items-start gap-6 mb-6">
                      <div className="h-20 w-20 rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-blue-600 overflow-hidden shrink-0 border border-blue-100 group-hover:scale-105 transition-transform duration-500">
                        {p.foto_url ? (
                          <img
                            src={p.foto_url}
                            alt={p.full_name || ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-black">
                            {p.nombre[0]}
                            {p.apellido[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                            M.P. {p.matricula}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors capitalize leading-tight mb-2">
                          {p.apellido}, {p.nombre}
                        </h3>

                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-slate-500 font-medium">
                            <MapPin className="h-4 w-4 mr-2 text-slate-300 shrink-0" />
                            <span className="truncate">
                              {p.direccion || p.localidad.nombre}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-blue-600 font-bold bg-blue-50/50 w-fit px-3 py-1 rounded-full border border-blue-100/50">
                            <Award className="h-3.5 w-3.5 mr-1.5" />
                            {p.especialidades[0]?.nombre ||
                              "Kinesiología General"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex gap-2">
                        {p.whatsapp && (
                          <a
                            href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            className="p-3 rounded-2xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm shadow-green-100"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                        {p.horarios && (
                          <div
                            className="p-3 rounded-2xl bg-slate-50 text-slate-400 cursor-help hover:bg-slate-100 transition-colors"
                            title={p.horarios}
                          >
                            <Calendar className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/profesionales/${p.slug}`}
                        className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center shadow-lg shadow-slate-200 hover:shadow-blue-200"
                      >
                        Ver Perfil <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination totalPages={totalPages} currentPage={currentPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
