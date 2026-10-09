import { MapPin, Briefcase, CalendarClock } from "lucide-react";
import type { AvisoKinesiologoPublico } from "@/lib/repositories/AvisoRepository";
import BotonContactar from "./BotonContactar";
import TextoExpandible from "./TextoExpandible";

/**
 * Tarjeta de la institución que busca kinesiólogo (`design.md — D8`). El tipo
 * `AvisoKinesiologoPublico` no tiene `medioContacto`: no se puede filtrar por
 * descuido en un `select` futuro sin romper el tipado acá.
 */
export default function AvisoKinesiologoCard({ aviso }: { aviso: AvisoKinesiologoPublico }) {
  const fechaLimite = aviso.fechaLimite ? new Date(aviso.fechaLimite) : null;

  return (
    <div className="bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col p-6 md:p-7 rounded-[2rem] md:rounded-[2.5rem] h-full">
      <div className="mb-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg inline-block mb-2">
          {aviso.tipoPuesto}
        </span>
        <h3 className="text-lg font-black text-slate-900 leading-tight">{aviso.institucion}</h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="flex items-center text-xs text-blue-600 font-bold bg-blue-50/50 px-3 py-1 rounded-full border border-blue-100/50">
          <Briefcase className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          {aviso.area}
        </span>
        <span className="flex items-center text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full">
          <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          {aviso.localidad.nombre}
          {aviso.zona ? ` · ${aviso.zona}` : ""}
        </span>
      </div>

      <TextoExpandible id={aviso.id} texto={aviso.propuesta} className="mb-2 flex-grow" />
      <p className="text-xs text-slate-400 leading-relaxed mb-4">{aviso.modalidad} · {aviso.diasHorarios}</p>

      {fechaLimite && (
        <div className="flex items-center text-xs text-amber-600 font-bold mb-5">
          <CalendarClock className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          Postulate antes del {fechaLimite.toLocaleDateString("es-AR")}
        </div>
      )}

      <div className="mt-auto pt-5 border-t border-slate-50">
        <BotonContactar tipo="busco-kinesiologo" id={aviso.id} />
      </div>
    </div>
  );
}
