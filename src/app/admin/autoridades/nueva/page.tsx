import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { ArrowLeft, Search, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import AdminSearch from "../../_components/AdminSearch";
import AutoridadForm from "../_components/AutoridadForm";

export const dynamic = "force-dynamic";

export default async function NuevaAutoridadPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; selectedId?: string }>;
}) {
  const { q, selectedId } = await searchParams;
  const query = q?.trim() ?? "";

  let profesionales: any[] = [];
  let selectedProfesional = null;

  if (query) {
    const result = await ProfesionalRepository.findPaginated(1, 20, { query });
    profesionales = result.data;
  }

  if (selectedId) {
    selectedProfesional = await ProfesionalRepository.findById(selectedId);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/autoridades"
          className="flex items-center text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al listado
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Agregar Miembro</h1>
            <p className="text-slate-500 font-medium">
              Buscá al profesional en el padrón para asignarle un cargo institucional.
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Paso 1: Buscar Profesional</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nombre, Apellido o Matrícula</p>
              </div>
            </div>

            <AdminSearch placeholder="Ej: Perez o 4567..." />

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {profesionales.length > 0 ? (
                profesionales.map((p) => (
                  <Link
                    key={p.id}
                    href={`?q=${query}&selectedId=${p.id}`}
                    className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                      selectedId === p.id 
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "bg-slate-50 border-slate-50 hover:bg-white hover:border-slate-200 text-slate-900"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedId === p.id ? "bg-blue-500 text-white" : "bg-white text-slate-400 shadow-sm"}`}>
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-black text-sm">{p.apellido}, {p.nombre}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedId === p.id ? "text-blue-100" : "text-slate-400"}`}>
                          M.P. {p.matricula}
                        </p>
                      </div>
                    </div>
                    {selectedId === p.id ? (
                      <ChevronRight className="h-5 w-5" />
                    ) : (
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Seleccionar</div>
                    )}
                  </Link>
                ))
              ) : query ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-bold text-slate-400">No se encontraron profesionales</p>
                </div>
              ) : (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Escribí para buscar...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          {selectedProfesional ? (
            <AutoridadForm profesional={selectedProfesional} />
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <Shield className="h-12 w-12 text-slate-200 mb-4" />
              <h4 className="text-lg font-bold text-slate-300 uppercase tracking-tight">Formulario de Alta</h4>
              <p className="text-slate-400 text-sm max-w-[200px] mt-2">
                Seleccioná un profesional de la lista para completar sus datos institucionales.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Shield(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
