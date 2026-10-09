import { MapPin, Award, Clock } from "lucide-react";
import type { AvisoTrabajoPublico } from "@/lib/repositories/AvisoRepository";
import BotonContactar from "./BotonContactar";
import TextoExpandible from "./TextoExpandible";

/**
 * Tarjeta del kinesiólogo que busca trabajo (`design.md — D8`). El tipo
 * `AvisoTrabajoPublico` no tiene teléfono/email/cvPath: si algún día alguien
 * intenta pasar un campo de contacto por props, esto deja de compilar.
 */
export default function AvisoTrabajoCard({ aviso }: { aviso: AvisoTrabajoPublico }) {
  return (
    <div className="bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col p-6 md:p-7 rounded-[2rem] md:rounded-[2.5rem] h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg inline-block mb-2">
            M.P. {aviso.matricula}
          </span>
          <h3 className="text-lg font-black text-slate-900 capitalize leading-tight">
            {aviso.nombre} {aviso.apellido}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="flex items-center text-xs text-blue-600 font-bold bg-blue-50/50 px-3 py-1 rounded-full border border-blue-100/50">
          <Award className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          {aviso.especialidad.nombre}
        </span>
        <span className="flex items-center text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full">
          <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          {aviso.localidad.nombre}
          {aviso.zona ? ` · ${aviso.zona}` : ""}
        </span>
      </div>

      <TextoExpandible id={aviso.id} texto={aviso.presentacion} className="mb-4 flex-grow" />

      <div className="flex items-center text-xs text-slate-400 font-medium mb-5">
        <Clock className="h-3.5 w-3.5 mr-1.5 shrink-0" />
        {aviso.disponibilidad}
      </div>

      <div className="mt-auto pt-5 border-t border-slate-50">
        <BotonContactar tipo="busco-trabajo" id={aviso.id} />
      </div>
    </div>
  );
}
