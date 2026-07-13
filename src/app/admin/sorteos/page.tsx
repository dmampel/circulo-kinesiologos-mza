import { SorteoRepository } from "@/lib/repositories/SorteoRepository";
import { Plus, Gift, Clock, Users, Pencil, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toggleEstadoSorteo } from "./actions";

export const dynamic = "force-dynamic";

const ESTADO_STYLES = {
  BORRADOR: "bg-orange-100 text-orange-600",
  ACTIVO: "bg-green-100 text-green-600",
  REALIZADO: "bg-slate-100 text-slate-500",
};

const ESTADO_LABELS = {
  BORRADOR: "Borrador",
  ACTIVO: "Activo",
  REALIZADO: "Realizado",
};

type SorteoListItem = Awaited<ReturnType<typeof SorteoRepository.findAll>>[number];

export default async function SorteosAdminPage() {
  const sorteos: SorteoListItem[] = await SorteoRepository.findAll();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Gestión de Sorteos</h1>
          <p className="text-slate-500 font-medium">
            Administrá los sorteos para socios del Círculo.
          </p>
        </div>
        <Link
          href="/admin/sorteos/nuevo"
          className="flex items-center px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 shrink-0"
        >
          <Plus className="mr-2 h-5 w-5" /> Nuevo Sorteo
        </Link>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3">
          <h3 className="font-black text-slate-900">Todos los Sorteos</h3>
          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-black">
            {sorteos.length}
          </span>
        </div>

        {sorteos.length === 0 ? (
          <div className="py-20 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Gift className="h-10 w-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">No hay sorteos creados</h4>
            <p className="text-slate-500 mt-2">Creá el primer sorteo para los socios.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sorteo</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inscriptos</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cierre</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorteos.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {s.titulo}
                        </p>
                        {s.estado === "REALIZADO" && s.ganador && (
                          <p className="text-xs text-green-600 font-bold flex items-center mt-0.5">
                            <Trophy className="mr-1 h-3 w-3" />
                            Ganador: {s.ganador.nombre} {s.ganador.apellido}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-300" />
                        <span className="text-xs font-black text-slate-700">
                          {s._count.inscripciones}
                          {s.maxParticipantes && (
                            <span className="text-slate-400 font-medium"> / {s.maxParticipantes}</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {s.fechaCierre ? (
                        <p className="text-xs font-bold text-slate-400 flex items-center uppercase tracking-wider">
                          <Clock className="mr-1.5 h-3 w-3" />
                          {new Date(s.fechaCierre).toLocaleDateString("es-AR")}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-300 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        ESTADO_STYLES[s.estado]
                      )}>
                        {ESTADO_LABELS[s.estado]}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.estado === "BORRADOR" && (
                          <form action={toggleEstadoSorteo.bind(null, s.id, "ACTIVO")}>
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-bold hover:bg-green-600 hover:text-white transition-all"
                            >
                              Publicar
                            </button>
                          </form>
                        )}
                        {s.estado === "ACTIVO" && (
                          <form action={toggleEstadoSorteo.bind(null, s.id, "BORRADOR")}>
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-600 hover:text-white transition-all"
                            >
                              Despublicar
                            </button>
                          </form>
                        )}
                        {s.estado !== "REALIZADO" && (
                          <Link
                            href={`/admin/sorteos/${s.id}/editar`}
                            className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-600 hover:text-white transition-all shadow-sm"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/sorteos/${s.id}`}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Ver detalle"
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
