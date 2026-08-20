"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Save, ChevronRight } from "lucide-react";
import { crearEntrada, actualizarEntrada } from "../actions";

interface EntradaFormProps {
  pacienteId: string;
  entradaId?: string;
  initialValues?: {
    motivo?: string | null;
    evolucion: string;
    fecha: Date;
  };
}

export default function EntradaHistoriaForm({
  pacienteId,
  entradaId,
  initialValues,
}: EntradaFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isEditing = !!entradaId;

  const defaultFecha = initialValues?.fecha
    ? new Date(initialValues.fecha).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = isEditing
      ? await actualizarEntrada(entradaId, pacienteId, formData)
      : await crearEntrada(pacienteId, formData);

    if (result.success) {
      router.push(`/mi-panel/turnos/pacientes/${pacienteId}`);
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-blue-900/5 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
          {isEditing ? <Save className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </div>
        <div>
          <h3 className="font-black text-slate-900 uppercase tracking-tight">
            {isEditing ? "Editar Entrada" : "Nueva Entrada"}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Historia Clínica
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Fecha y Hora <span className="text-red-400">*</span>
            </label>
            <input
              name="fecha"
              type="datetime-local"
              required
              defaultValue={defaultFecha}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-sm font-bold outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Motivo de Consulta
            </label>
            <input
              name="motivo"
              defaultValue={initialValues?.motivo ?? ""}
              placeholder="Ej: Dolor lumbar, control, etc."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-sm font-bold outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Evolución <span className="text-red-400">*</span>
          </label>
          <textarea
            name="evolucion"
            rows={8}
            required
            defaultValue={initialValues?.evolucion ?? ""}
            placeholder="Registrá la evolución clínica, observaciones, indicaciones..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-sm font-bold outline-none transition-all resize-none leading-relaxed"
          />
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
        >
          {loading ? "Guardando..." : (
            <>
              {isEditing ? "Guardar Cambios" : "Registrar Entrada"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
