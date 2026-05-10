"use client";

import { useState } from "react";
import { cancelarInscripcionSocio } from "@/app/mi-panel/capacitaciones/actions";

interface Props {
  inscripcionId: string;
  profesionalId: string;
}

export default function BotonCancelarInscripcion({ inscripcionId, profesionalId }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancelar = async () => {
    setLoading(true);
    try {
      await cancelarInscripcionSocio(inscripcionId, profesionalId);
    } finally {
      setLoading(false);
      setConfirmando(false);
    }
  };

  if (confirmando) {
    return (
      <div className="flex flex-col gap-1.5 items-end">
        <p className="text-[10px] font-bold text-slate-500">¿Confirmás la baja?</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmando(false)}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            No
          </button>
          <button
            onClick={handleCancelar}
            disabled={loading}
            className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline transition-colors disabled:opacity-50"
          >
            {loading ? "Cancelando..." : "Sí, cancelar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="text-[10px] font-bold text-slate-400 hover:text-red-500 hover:underline transition-colors"
    >
      Bajarme
    </button>
  );
}
