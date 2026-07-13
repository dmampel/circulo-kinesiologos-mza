import { SorteoRepository } from "@/lib/repositories/SorteoRepository";
import { ArrowLeft, Trophy, Users, Calendar, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { toggleEstadoSorteo, realizarSorteoAction } from "../actions";

export const dynamic = "force-dynamic";

const ESTADO_STYLES = {
  BORRADOR: "bg-orange-100 text-orange-600 border-orange-200",
  ACTIVO: "bg-green-100 text-green-600 border-green-200",
  REALIZADO: "bg-slate-100 text-slate-500 border-slate-200",
};

const ESTADO_LABELS = {
  BORRADOR: "Borrador",
  ACTIVO: "Activo",
  REALIZADO: "Realizado",
};

export default async function SorteoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sorteo = await SorteoRepository.findById(id);

  if (!sorteo) notFound();

  const puedeRealizarse = sorteo.estado === "ACTIVO" && sorteo.inscripciones.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/sorteos"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border",
                ESTADO_STYLES[sorteo.estado]
              )}>
                {ESTADO_LABELS[sorteo.estado]}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">{sorteo.titulo}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {sorteo.estado !== "REALIZADO" && (
            <Link
              href={`/admin/sorteos/${sorteo.id}/editar`}
              className="flex items-center px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-sm hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm"
            >
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </Link>
          )}
          {sorteo.estado === "BORRADOR" && (
            <form action={toggleEstadoSorteo.bind(null, sorteo.id, "ACTIVO")}>
              <button type="submit" className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all shadow-sm">
                Publicar sorteo
              </button>
            </form>
          )}
          {sorteo.estado === "ACTIVO" && (
            <form action={toggleEstadoSorteo.bind(null, sorteo.id, "BORRADOR")}>
              <button type="submit" className="px-4 py-2 rounded-xl bg-orange-100 text-orange-600 font-bold text-sm hover:bg-orange-600 hover:text-white transition-all">
                Despublicar
              </button>
            </form>
          )}
          {puedeRealizarse && (
            <form action={realizarSorteoAction.bind(null, sorteo.id)}>
              <button
                type="submit"
                className="flex items-center px-6 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                <Trophy className="mr-2 h-4 w-4" /> Realizar Sorteo
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Info del sorteo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inicio</p>
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Calendar className="h-4 w-4 text-slate-300" />
            {new Date(sorteo.fechaInicio).toLocaleDateString("es-AR")}
          </div>
        </div>
        {sorteo.fechaCierre && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cierre</p>
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Calendar className="h-4 w-4 text-slate-300" />
              {new Date(sorteo.fechaCierre).toLocaleDateString("es-AR")}
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inscriptos</p>
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Users className="h-4 w-4 text-slate-300" />
            {sorteo.inscripciones.length}
            {sorteo.maxParticipantes && (
              <span className="text-slate-400 font-medium text-sm"> / {sorteo.maxParticipantes}</span>
            )}
          </div>
        </div>
      </div>

      {sorteo.estado === "REALIZADO" && sorteo.ganador && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-3xl p-6 flex items-center gap-4">
          <div className="h-12 w-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-200">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Ganador del Sorteo</p>
            <p className="text-xl font-black text-slate-900">
              {sorteo.ganador.nombre} {sorteo.ganador.apellido}
            </p>
            <p className="text-sm text-slate-500 font-medium">M.P. {sorteo.ganador.matricula}</p>
          </div>
        </div>
      )}

      {/* Lista de inscriptos */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h3 className="font-black text-slate-900">Inscriptos ({sorteo.inscripciones.length})</h3>
        </div>

        {sorteo.inscripciones.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500 font-medium">No hay inscriptos todavía.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Socio</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inscripto el</th>
                  {sorteo.estado === "REALIZADO" && (
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorteo.inscripciones.map((insc) => {
                  const esGanador = sorteo.ganadorId === insc.profesionalId;
                  return (
                    <tr
                      key={insc.id}
                      className={cn(
                        "transition-colors",
                        esGanador ? "bg-yellow-50" : "hover:bg-slate-50/50"
                      )}
                    >
                      <td className="px-8 py-4">
                        <p className="font-bold text-slate-900">
                          {insc.profesional.nombre} {insc.profesional.apellido}
                        </p>
                        <p className="text-xs text-slate-500">{insc.profesional.email}</p>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-sm font-black text-slate-600">M.P. {insc.profesional.matricula}</span>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-xs font-bold text-slate-400">
                          {new Date(insc.createdAt).toLocaleDateString("es-AR")}
                        </p>
                      </td>
                      {sorteo.estado === "REALIZADO" && (
                        <td className="px-8 py-4">
                          {esGanador ? (
                            <span className="flex items-center gap-1 text-xs font-black text-amber-600">
                              <Trophy className="h-3.5 w-3.5" /> Ganador
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
