"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * El resumen se recalcula en cada carga, así que "actualizar" es simplemente
 * volver a pedir la página. `actualizadoEl` llega ya formateado del server para
 * que no haya diferencia de huso horario entre el HTML y la hidratación.
 */
export default function BotonActualizar({ actualizadoEl }: { actualizadoEl: string }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  return (
    <button
      onClick={() => iniciar(() => router.refresh())}
      disabled={pendiente}
      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-blue-600 hover:border-blue-100 transition-all disabled:opacity-50"
      title="Volver a consultar el estado"
    >
      <RefreshCw className={`h-4 w-4 ${pendiente ? "animate-spin" : ""}`} />
      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
        {pendiente ? "Actualizando" : `Actualizado ${actualizadoEl}`}
      </span>
    </button>
  );
}
