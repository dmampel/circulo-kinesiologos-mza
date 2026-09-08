"use client";

import { Check, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { gestionarSolicitud } from "./actions";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";

export default function BotonesSolicitud({ id }: { id: string }) {
  const [isPending, setIsPending] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<"APROBAR" | "RECHAZAR" | null>(null);

  const confirmar = async () => {
    if (!accionPendiente) return;
    const accion = accionPendiente;
    setAccionPendiente(null);

    setIsPending(true);
    try {
      const result = await gestionarSolicitud(id, accion);
      if (!result.success) {
        alert(result.error || "Hubo un error al procesar la acción.");
      }
    } catch (error) {
      alert("Error de conexión al procesar la acción.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end space-x-2">
        <button
          onClick={() => setAccionPendiente("APROBAR")}
          disabled={isPending}
          className="p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-100/50 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setAccionPendiente("RECHAZAR")}
          disabled={isPending}
          className="p-3 rounded-xl bg-white text-slate-400 border border-slate-100 hover:border-red-200 hover:text-red-500 transition-all disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ConfirmDialog
        open={accionPendiente !== null}
        title={accionPendiente === "RECHAZAR" ? "¿Rechazar esta solicitud?" : "¿Aprobar esta solicitud?"}
        description={
          accionPendiente === "RECHAZAR"
            ? "Se le va a avisar al solicitante que su solicitud fue rechazada."
            : "Se va a invitar al profesional y darlo de alta como socio del Círculo."
        }
        confirmLabel={accionPendiente === "RECHAZAR" ? "Rechazar" : "Aprobar"}
        variant={accionPendiente === "RECHAZAR" ? "danger" : "default"}
        pending={isPending}
        onConfirm={confirmar}
        onCancel={() => setAccionPendiente(null)}
      />
    </>
  );
}
