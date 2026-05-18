"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Save, ChevronRight } from "lucide-react";
import { crearPaciente, actualizarPaciente } from "../actions";

interface PacienteFormProps {
  id?: string;
  initialValues?: {
    nombre: string;
    apellido: string;
    telefono?: string | null;
    email?: string | null;
    notas?: string | null;
  };
}

export default function PacienteForm({ id, initialValues }: PacienteFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isEditing = !!id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = isEditing
      ? await actualizarPaciente(id, formData)
      : await crearPaciente(formData);

    if (result.success) {
      router.push("/mi-panel/turnos/pacientes");
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-blue-900/5 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
          {isEditing ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
        </div>
        <div>
          <h3 className="font-black text-slate-900 uppercase tracking-tight">
            {isEditing ? "Editar Paciente" : "Nuevo Paciente"}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {isEditing ? "Actualizar datos" : "Datos personales"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              name="nombre"
              required
              defaultValue={initialValues?.nombre}
              placeholder="Ej: Juan"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm font-bold outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Apellido <span className="text-red-400">*</span>
            </label>
            <input
              name="apellido"
              required
              defaultValue={initialValues?.apellido}
              placeholder="Ej: García"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm font-bold outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Teléfono
            </label>
            <input
              name="telefono"
              type="tel"
              defaultValue={initialValues?.telefono ?? ""}
              placeholder="Ej: 261 4123456"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm font-bold outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              defaultValue={initialValues?.email ?? ""}
              placeholder="Ej: juan@email.com"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm font-bold outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Notas
          </label>
          <textarea
            name="notas"
            rows={3}
            defaultValue={initialValues?.notas ?? ""}
            placeholder="Notas clínicas, antecedentes, observaciones..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm font-bold outline-none transition-all resize-none"
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
          className="w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
        >
          {loading ? "Guardando..." : (
            <>
              {isEditing ? "Guardar Cambios" : "Crear Paciente"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
