"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { eliminarPaciente, checkTieneTurnos } from "../actions";
import { useRouter } from "next/navigation";

export default function DeletePacienteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);

    const tieneTurnos = await checkTieneTurnos(id);
    if (tieneTurnos) {
      const confirmar = confirm(
        "Este paciente tiene turnos asociados. Si lo eliminás se borrarán todos sus turnos. ¿Querés continuar?"
      );
      if (!confirmar) {
        setLoading(false);
        return;
      }
    } else {
      const confirmar = confirm("¿Confirmar eliminación del paciente?");
      if (!confirmar) {
        setLoading(false);
        return;
      }
    }

    const result = await eliminarPaciente(id);
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
      title="Eliminar paciente"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
