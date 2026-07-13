"use client";

import { useActionState } from "react";
import { updateSorteo } from "../../actions";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Sorteo } from "@prisma/client";

function toDatetimeLocal(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function EditarSorteoForm({ sorteo }: { sorteo: Sorteo }) {
  const updateWithId = updateSorteo.bind(null, sorteo.id);
  const [state, action, pending] = useActionState(updateWithId, null);
  const disabled = sorteo.estado === "REALIZADO";

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/sorteos/${sorteo.id}`}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Editar Sorteo</h1>
          <p className="text-sm text-slate-500 font-medium">
            {disabled ? "Este sorteo ya fue realizado y no puede editarse." : "Modificá los datos del sorteo."}
          </p>
        </div>
      </div>

      <form action={action} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 space-y-6">
        <fieldset disabled={disabled} className="space-y-6 disabled:opacity-60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Título</label>
              <input
                name="titulo"
                required
                defaultValue={sorteo.titulo}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:cursor-not-allowed"
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
                defaultValue={toDatetimeLocal(sorteo.fechaInicio)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:cursor-not-allowed"
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
                defaultValue={toDatetimeLocal(sorteo.fechaCierre)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Máx. Participantes (Opcional)</label>
              <input
                type="number"
                name="maxParticipantes"
                min="1"
                defaultValue={sorteo.maxParticipantes ?? ""}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:cursor-not-allowed"
                placeholder="Sin límite"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">URL de Imagen (Opcional)</label>
              <input
                type="url"
                name="imagen_url"
                defaultValue={sorteo.imagen_url ?? ""}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:cursor-not-allowed"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Descripción</label>
            <textarea
              name="descripcion"
              required
              rows={4}
              defaultValue={sorteo.descripcion}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none disabled:cursor-not-allowed"
            />
            {state?.errors?.descripcion?.[0] && (
              <p className="text-xs font-medium text-red-500">{state.errors.descripcion[0]}</p>
            )}
          </div>
        </fieldset>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-4">
          <Link
            href={`/admin/sorteos/${sorteo.id}`}
            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </Link>
          {!disabled && (
            <button
              type="submit"
              disabled={pending}
              className="flex items-center px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" /> {pending ? "Guardando..." : "Guardar Cambios"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
