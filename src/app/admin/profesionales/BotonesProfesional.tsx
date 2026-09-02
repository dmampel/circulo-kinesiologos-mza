"use client";

import { useState } from "react";
import { Edit2, Ban, CheckCircle2, Send } from "lucide-react";
import Link from "next/link";
import { toggleEstadoProfesional, reenviarInvitacion } from "./actions";

export default function BotonesProfesional({
  id,
  status,
  tieneCuenta,
}: {
  id: string;
  status: "ACTIVO" | "INACTIVO" | "PENDIENTE";
  tieneCuenta: boolean;
}) {
  const [enviando, setEnviando] = useState(false);

  const handleToggleEstado = async () => {
    const nuevoEstado = status === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    if (confirm(`¿Estás seguro de que querés ${nuevoEstado === "ACTIVO" ? "activar" : "suspender"} a este profesional?`)) {
      await toggleEstadoProfesional(id, nuevoEstado);
    }
  };

  const handleReenviarInvitacion = async () => {
    if (!confirm("¿Reenviar el link de activación de cuenta a este profesional?")) return;
    setEnviando(true);
    try {
      const resultado = await reenviarInvitacion(id);
      if (!resultado.success) {
        alert(resultado.error);
      } else {
        alert("Invitación reenviada.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      <Link
        href={`/admin/profesionales/${id}`}
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
        title="Editar Profesional"
      >
        <Edit2 className="h-4 w-4" />
      </Link>

      {tieneCuenta && (
        <button
          onClick={handleReenviarInvitacion}
          disabled={enviando}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-40"
          title="Reenviar invitación"
        >
          <Send className="h-4 w-4" />
        </button>
      )}

      <button
        onClick={handleToggleEstado}
        className={`p-2 rounded-lg transition-all ${
          status === "ACTIVO" 
            ? "text-slate-400 hover:text-orange-600 hover:bg-orange-50" 
            : "text-slate-400 hover:text-green-600 hover:bg-green-50"
        }`}
        title={status === "ACTIVO" ? "Suspender" : "Activar"}
      >
        {status === "ACTIVO" ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
