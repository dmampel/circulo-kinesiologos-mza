import { getProfesionales } from "./actions";
import ClientSearch from "./ClientSearch";
import BotonesProfesional from "./BotonesProfesional";
import Link from "next/link";
import { Plus, User, MapPin, Check, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function ProfesionalesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams?.q || "";
  const profesionales = await getProfesionales(query);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Padrón de Profesionales</h1>
          <p className="text-slate-500 font-medium">Gestioná el directorio completo de kinesiólogos.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <ClientSearch />
          <Link 
            href="/admin/profesionales/nuevo"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-bold flex items-center shadow-lg shadow-blue-900/20 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" /> Alta Manual
          </Link>
        </div>
      </div>

      {profesionales.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-slate-200">
          <div className="mx-auto h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <User className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No se encontraron profesionales</h3>
          <p className="text-slate-500">Probá con otra búsqueda o agregá un profesional nuevo.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profesional</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Localidad</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {profesionales.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                        {p.foto_url ? (
                          <img src={p.foto_url} alt={p.nombre} className="h-full w-full object-cover" />
                        ) : (
                          `${p.nombre[0]}${p.apellido[0]}`
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{p.apellido}, {p.nombre}</p>
                        <p className="text-xs text-slate-400">{p.especialidades.map(e => e.nombre).join(" • ") || "Sin especialidad"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-slate-600">M.P. {p.matricula}</span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-400 flex items-center">
                      <MapPin className="mr-1.5 h-3 w-3" /> 
                      {p.localidad.nombre}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center w-max",
                      p.status === "ACTIVO" ? "bg-green-100 text-green-600" :
                      p.status === "PENDIENTE" ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"
                    )}>
                      {p.status === "ACTIVO" ? <Check className="h-3 w-3 mr-1" /> : <Ban className="h-3 w-3 mr-1" />}
                      {p.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <BotonesProfesional id={p.id} status={p.status as "ACTIVO" | "INACTIVO" | "PENDIENTE"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
