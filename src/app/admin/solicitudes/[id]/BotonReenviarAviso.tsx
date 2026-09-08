"use client";

import { Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { reenviarAvisoInstitucional } from "../actions";

/**
 * Botón de reenvío del aviso institucional para el detalle de una solicitud.
 * Vive junto al detalle (`[id]/`), no dentro de `BotonesSolicitud` (que es de
 * la lista): no comparte su `isPending` porque no es una acción mutante ni
 * está atada al status `PENDIENTE` (D7 del design).
 */
export default function BotonReenviarAviso({ id }: { id: string }) {
  const [isPending, setIsPending] = useState(false);

  const handleReenviar = async () => {
    if (!confirm("¿Reenviar el aviso completo de esta solicitud a administración?")) return;

    setIsPending(true);
    try {
      const result = await reenviarAvisoInstitucional(id);
      if (result.success) {
        alert("Aviso reenviado a administración.");
      } else {
        alert(result.error ?? "No se pudo reenviar el aviso.");
      }
    } catch {
      alert("Error de conexión al reenviar el aviso.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleReenviar}
      disabled={isPending}
      className="flex h-12 items-center gap-2 rounded-2xl border border-slate-100 bg-white px-5 text-sm font-bold text-slate-600 transition-all hover:text-blue-600 hover:shadow-md disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      Reenviar aviso
    </button>
  );
}
