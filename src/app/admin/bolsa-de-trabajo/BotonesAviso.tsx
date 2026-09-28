"use client";

import { Check, X, Archive, Loader2 } from "lucide-react";
import { useState } from "react";
import type { EstadoAviso } from "@prisma/client";
import { cambiarEstadoAviso } from "./actions";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";

type Tipo = "busco-trabajo" | "busco-kinesiologo";
type Accion = "PUBLICADO" | "RECHAZADO" | "ARCHIVADO";

const CONFIRM: Record<Accion, { title: string; description: string; confirmLabel: string; variant: "default" | "danger" }> = {
  PUBLICADO: {
    title: "¿Aprobar este aviso?",
    description: "Va a aparecer en el listado público de la Bolsa de Trabajo.",
    confirmLabel: "Aprobar",
    variant: "default",
  },
  RECHAZADO: {
    title: "¿Rechazar este aviso?",
    description: "No va a aparecer en el listado público ni va a revelar su contacto.",
    confirmLabel: "Rechazar",
    variant: "danger",
  },
  ARCHIVADO: {
    title: "¿Archivar este aviso?",
    description: "Deja de estar visible en el listado público, pero queda guardado.",
    confirmLabel: "Archivar",
    variant: "danger",
  },
};

/** Aprobar / rechazar / archivar desde la bandeja (`tasks.md — 5.2`). */
export default function BotonesAviso({ tipo, id, estado }: { tipo: Tipo; id: string; estado: EstadoAviso }) {
  const [isPending, setIsPending] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<Accion | null>(null);

  const confirmar = async () => {
    if (!accionPendiente) return;
    const accion = accionPendiente;
    setAccionPendiente(null);

    setIsPending(true);
    try {
      const result = await cambiarEstadoAviso(tipo, id, accion);
      if (!result.success) {
        alert(result.error || "Hubo un error al procesar la acción.");
      }
    } catch {
      alert("Error de conexión al procesar la acción.");
    } finally {
      setIsPending(false);
    }
  };

  const dialogo = accionPendiente ? CONFIRM[accionPendiente] : null;

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {estado !== "PUBLICADO" && (
          <button
            onClick={() => setAccionPendiente("PUBLICADO")}
            disabled={isPending}
            title="Aprobar"
            className="p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-100/50 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
        )}
        {estado !== "RECHAZADO" && (
          <button
            onClick={() => setAccionPendiente("RECHAZADO")}
            disabled={isPending}
            title="Rechazar"
            className="p-3 rounded-xl bg-white text-slate-400 border border-slate-100 hover:border-red-200 hover:text-red-500 transition-all disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {estado !== "ARCHIVADO" && (
          <button
            onClick={() => setAccionPendiente("ARCHIVADO")}
            disabled={isPending}
            title="Archivar"
            className="p-3 rounded-xl bg-white text-slate-400 border border-slate-100 hover:border-slate-300 hover:text-slate-600 transition-all disabled:opacity-50"
          >
            <Archive className="h-4 w-4" />
          </button>
        )}
      </div>

      {dialogo && (
        <ConfirmDialog
          open={accionPendiente !== null}
          title={dialogo.title}
          description={dialogo.description}
          confirmLabel={dialogo.confirmLabel}
          variant={dialogo.variant}
          pending={isPending}
          onConfirm={confirmar}
          onCancel={() => setAccionPendiente(null)}
        />
      )}
    </>
  );
}
