import Image from "next/image";
import { AutoridadRepository } from "@/lib/repositories/AutoridadRepository";
import {
  Plus,
  ShieldCheck,
  Edit,
  Users,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import DeleteAutoridadButton from "./_components/DeleteAutoridadButton";

export const dynamic = "force-dynamic";

export default async function AutoridadesAdminPage() {
  const autoridades = await AutoridadRepository.findAll();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Comisión Directiva</h1>
          <p className="text-slate-500 font-medium">
            Gestioná los miembros de la comisión y su orden de visualización.
          </p>
        </div>
        <Link
          href="/admin/autoridades/nueva"
          className="flex items-center px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 shrink-0"
        >
          <Plus className="mr-2 h-5 w-5" /> Agregar Miembro
        </Link>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-slate-900">Miembros Actuales</h3>
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-black">
              {autoridades.length}
            </span>
          </div>
        </div>

        {autoridades.length === 0 ? (
          <div className="py-20 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              No hay autoridades cargadas
            </h4>
            <p className="text-slate-500 mt-2">
              Empezá agregando al Presidente o miembros de la comisión.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">
                    #
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Profesional
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Cargo
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {autoridades.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6 text-center">
                      <span className="text-sm font-black text-slate-300 group-hover:text-blue-500 transition-colors">
                        {a.orden}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center text-slate-400">
                          {a.profesional.foto_url ? (
                            <Image
                              src={a.profesional.foto_url}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {a.profesional.full_name || `${a.profesional.nombre} ${a.profesional.apellido}`}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            M.P. {a.profesional.matricula}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                        {a.cargo}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Ver Profesional */}
                        <Link
                          href={`/profesionales/${a.profesional.full_name?.toLowerCase().replace(/ /g, '-')}`} // Simplistic slug
                          target="_blank"
                          className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all"
                          title="Ver Profesional"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>

                        <Link
                          href={`/admin/autoridades/editar/${a.id}`}
                          className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        
                        <DeleteAutoridadButton id={a.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Link 
          href="/institucional" 
          target="_blank"
          className="flex items-center text-xs font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
        >
          Ver página institucional <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
