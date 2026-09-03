"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { reenviarInvitacion } from "../profesionales/actions";

/**
 * Reenvía el link de activación a un socio en limbo y refresca la vista, para
 * que la fecha de invitación se actualice sin recargar a mano.
 */
export default function BotonReenviar({ id }: { id: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  const handleClick = async () => {
    if (!confirm("¿Reenviar el link de activación a este profesional?")) return;
    setEnviando(true);
    try {
      const resultado = await reenviarInvitacion(id);
      if (!resultado.success) {
        alert(resultado.error);
        return;
      }
      alert("Invitación reenviada.");
      router.refresh();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={enviando}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-40"
      title="Reenviar invitación"
    >
      <Send className="h-3.5 w-3.5" />
      {enviando ? "Enviando" : "Reenviar"}
    </button>
  );
}
