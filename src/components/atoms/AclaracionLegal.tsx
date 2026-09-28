import { ShieldAlert } from "lucide-react";

/**
 * Texto legal al pie de los dos listados y de los dos formularios
 * (`design.md — D8`, `tasks.md — 4.2`). Un solo componente, cuatro usos: el
 * texto no se copia a mano en ningún lado. Copy aprobada por el cliente,
 * usar tal cual.
 */
export default function AclaracionLegal() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:p-5 text-xs text-slate-500 leading-relaxed">
      <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
      <p>
        Importante: la publicación de una búsqueda no implica recomendación, contratación ni intermediación
        laboral por parte del CKFM. Las condiciones de cada propuesta y el proceso de selección son
        responsabilidad de las partes involucradas.
      </p>
    </div>
  );
}
