import { Search } from "lucide-react";
import Pagination from "@/components/molecules/Pagination";
import AvisoTrabajoCard from "@/components/molecules/AvisoTrabajoCard";
import AvisoKinesiologoCard from "@/components/molecules/AvisoKinesiologoCard";
import type { AvisoTrabajoPublico, AvisoKinesiologoPublico } from "@/lib/repositories/AvisoRepository";

type Props =
  | { tipo: "busco-trabajo"; avisos: AvisoTrabajoPublico[]; totalPages: number; currentPage: number }
  | { tipo: "busco-kinesiologo"; avisos: AvisoKinesiologoPublico[]; totalPages: number; currentPage: number };

/** Grilla de tarjetas + estado vacío + paginado (`design.md — D8`, `tasks.md — 4.5`). */
export default function ListadoAvisos(props: Props) {
  const { avisos, totalPages, currentPage } = props;

  if (avisos.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Search className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No encontramos avisos</h3>
        <p className="text-slate-500">
          {props.tipo === "busco-trabajo"
            ? "Probá ajustando los filtros, o volvé a mirar más tarde."
            : "No hay búsquedas de kinesiólogos publicadas con esos filtros por ahora."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {props.tipo === "busco-trabajo"
          ? props.avisos.map((aviso) => <AvisoTrabajoCard key={aviso.id} aviso={aviso} />)
          : props.avisos.map((aviso) => <AvisoKinesiologoCard key={aviso.id} aviso={aviso} />)}
      </div>

      <Pagination totalPages={totalPages} currentPage={currentPage} />
    </>
  );
}
