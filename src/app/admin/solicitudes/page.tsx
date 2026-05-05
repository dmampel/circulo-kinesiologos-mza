import prisma from "@/lib/prisma";
import { 
  FileText, 
  Check, 
  X, 
  User, 
  Mail, 
  Calendar, 
  Search,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import BotonesSolicitud from "./BotonesSolicitud";

export default async function SolicitudesAdminPage() {
  const solicitudes = await prisma.solicitud.findMany({
    orderBy: { creada_en: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Solicitudes de Ingreso</h1>
          <p className="text-slate-500 font-medium">Revisá y gestioná las peticiones de nuevos socios.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <Search className="ml-2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            className="bg-transparent border-none focus:ring-0 text-sm font-medium pr-4"
          />
        </div>
      </div>

      {solicitudes.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-slate-200">
          <div className="mx-auto h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Check className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No hay solicitudes pendientes</h3>
          <p className="text-slate-500">Parece que todos los trámites están al día.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profesional</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {solicitudes.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <Link href={`/admin/solicitudes/${s.id}`} className="flex items-center space-x-4 group/item">
                      <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold group-hover/item:bg-blue-600 group-hover/item:text-white transition-all">
                        {s.nombre[0]}{s.apellido[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 group-hover/item:text-blue-600 transition-colors">{s.apellido}, {s.nombre}</p>
                        <p className="text-xs text-slate-400 flex items-center"><Mail className="mr-1 h-3 w-3" /> {s.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-slate-600">M.P. {s.matricula}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
                      s.status === "PENDIENTE" ? "bg-orange-100 text-orange-600" :
                      s.status === "APROBADA" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-400 flex items-center uppercase tracking-wider">
                      <Calendar className="mr-1.5 h-3 w-3" /> 
                      {new Date(s.creada_en).toLocaleDateString("es-AR")}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <BotonesSolicitud id={s.id} />
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

import { cn } from "@/lib/utils";
