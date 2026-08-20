"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { eliminarEntrada } from "../actions";
import { useRouter } from "next/navigation";

interface Props {
  entradaId: string;
  pacienteId: string;
}

export default function DeleteEntradaButton({ entradaId, pacienteId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    const confirmar = confirm("¿Eliminar esta entrada de la historia clínica?");
    if (!confirmar) return;

    setLoading(true);
    const result = await eliminarEntrada(entradaId, pacienteId);
    if (!result.success) {
      alert("Error: " + result.error);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
      title="Eliminar entrada"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
