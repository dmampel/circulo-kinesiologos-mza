import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";
import { Plus, BookOpen, Clock, Search, Users, Pencil } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type CapacitacionListItem = Awaited<ReturnType<typeof CapacitacionRepository.findAll>>[number];

export default async function CapacitacionesAdminPage() {
  const capacitaciones: CapacitacionListItem[] = await CapacitacionRepository.findAll();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Gestión de Capacitaciones</h1>
          <p className="text-slate-500 font-medium">Administrá cursos, asambleas y eventos, y controlá las inscripciones.</p>
        </div>
        <Link
          href="/admin/capacitaciones/nuevo"
          className="flex items-center px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 shrink-0"
        >
          <Plus className="mr-2 h-5 w-5" /> Nueva Capacitación
        </Link>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-black text-slate-900">Todas las Capacitaciones</h3>
          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <Search className="ml-2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent border-none focus:ring-0 text-sm font-medium pr-4"
            />
          </div>
        </div>

        {capacitaciones.length === 0 ? (
          <div className="py-20 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <BookOpen className="h-10 w-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">No hay capacitaciones creadas</h4>
            <p className="text-slate-500 mt-2">Creá el primer evento o curso para los profesionales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacitación</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Modalidad</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Inicio</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inscriptos</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {capacitaciones.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{c.titulo}</p>
                        <p className="text-xs text-slate-400 font-medium">{c.tipo}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-500">{c.modalidad}</span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-400 flex items-center uppercase tracking-wider">
                        <Clock className="mr-1.5 h-3 w-3" />
                        {new Date(c.fechaInicio).toLocaleDateString("es-AR")}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-300" />
                        <span className="text-xs font-black text-slate-700">
                          {c._count.inscripciones} {c.cupoMaximo && <span className="text-slate-400 font-medium">/ {c.cupoMaximo}</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        c.publicada ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                      )}>
                        {c.publicada ? "Publicada" : "Borrador"}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/capacitaciones/${c.id}/editar`}
                          className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-600 hover:text-white transition-all shadow-sm"
                          title="Editar capacitación"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/capacitaciones/${c.id}`}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Gestionar inscriptos"
                        >
                          <Users className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
