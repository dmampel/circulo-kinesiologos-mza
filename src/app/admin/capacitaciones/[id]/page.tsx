import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { cambiarEstadoInscripcion } from "../actions";

export default async function CapacitacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const capacitacion = await CapacitacionRepository.findById(id);

  if (!capacitacion) return <div>No encontrada</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/capacitaciones"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
              {capacitacion.tipo}
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200">
              {capacitacion.modalidad}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">{capacitacion.titulo}</h1>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-slate-900">Inscriptos ({capacitacion.inscripciones.length})</h3>
        </div>

        {capacitacion.inscripciones.length === 0 ? (
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
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {capacitacion.inscripciones.map((insc) => (
                  <tr key={insc.id} className="hover:bg-slate-50/50 transition-colors">
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
                        {new Date(insc.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-8 py-4">
                      {insc.estado === "PENDIENTE" && (
                        <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-100 flex items-center w-max">
                          <Clock className="mr-1 h-3 w-3" /> Pendiente
                        </span>
                      )}
                      {insc.estado === "CONFIRMADA" && (
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100 flex items-center w-max">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmada
                        </span>
                      )}
                      {insc.estado === "CANCELADA" && (
                        <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-100 flex items-center w-max">
                          <XCircle className="mr-1 h-3 w-3" /> Cancelada
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-4 text-right">
                      {insc.estado === "PENDIENTE" && (
                        <form action={cambiarEstadoInscripcion.bind(null, insc.id, "CONFIRMADA")}>
                          <button type="submit" className="text-xs font-bold text-blue-600 hover:underline">
                            Confirmar Pago
                          </button>
                        </form>
                      )}
                      {insc.estado === "CONFIRMADA" && (
                        <form action={cambiarEstadoInscripcion.bind(null, insc.id, "PENDIENTE")}>
                          <button type="submit" className="text-xs font-bold text-orange-600 hover:underline">
                            Marcar Pendiente
                          </button>
                        </form>
                      )}
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
