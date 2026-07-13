"use client";

import { useActionState } from "react";
import { createSorteo } from "../actions";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NuevoSorteoPage() {
  const [state, action, pending] = useActionState(createSorteo, null);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/sorteos"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Nuevo Sorteo</h1>
          <p className="text-sm text-slate-500 font-medium">Completá los datos del sorteo.</p>
        </div>
      </div>

      <form action={action} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Título</label>
            <input
              name="titulo"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ej: Gran Sorteo de Invierno"
            />
            {state?.errors?.titulo?.[0] && (
              <p className="text-xs font-medium text-red-500">{state.errors.titulo[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Fecha de Inicio</label>
            <input
              type="datetime-local"
              name="fechaInicio"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            {state?.errors?.fechaInicio?.[0] && (
              <p className="text-xs font-medium text-red-500">{state.errors.fechaInicio[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Fecha de Cierre (Opcional)</label>
            <input
              type="datetime-local"
              name="fechaCierre"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            {state?.errors?.fechaCierre?.[0] && (
              <p className="text-xs font-medium text-red-500">{state.errors.fechaCierre[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Máx. Participantes (Opcional)</label>
            <input
              type="number"
              name="maxParticipantes"
              min="1"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Sin límite si está vacío"
            />
            {state?.errors?.maxParticipantes?.[0] && (
              <p className="text-xs font-medium text-red-500">{state.errors.maxParticipantes[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">URL de Imagen (Opcional)</label>
            <input
              type="url"
              name="imagen_url"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="https://..."
            />
            {state?.errors?.imagen_url?.[0] && (
              <p className="text-xs font-medium text-red-500">{state.errors.imagen_url[0]}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Descripción</label>
          <textarea
            name="descripcion"
            required
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            placeholder="Describí el premio y las condiciones del sorteo..."
          />
          {state?.errors?.descripcion?.[0] && (
            <p className="text-xs font-medium text-red-500">{state.errors.descripcion[0]}</p>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-4">
          <Link
            href="/admin/sorteos"
            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-60"
          >
            <Save className="mr-2 h-4 w-4" /> {pending ? "Guardando..." : "Guardar Sorteo"}
          </button>
        </div>
      </form>
    </div>
  );
}
