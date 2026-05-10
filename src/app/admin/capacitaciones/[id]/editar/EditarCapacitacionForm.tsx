"use client";

import { useActionState } from "react";
import { updateCapacitacion } from "../../actions";
import { Save } from "lucide-react";
import Link from "next/link";

type Capacitacion = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  modalidad: string;
  fechaInicio: Date;
  fechaFin: Date | null;
  ubicacion: string | null;
  cupoMaximo: number | null;
  costo: number | null | { toNumber: () => number };
  publicada: boolean;
};

interface Props {
  capacitacion: Capacitacion;
}

function toDatetimeLocal(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  // Format: YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toCosto(costo: Capacitacion["costo"]): string {
  if (costo === null || costo === undefined) return "";
  if (typeof costo === "object" && "toNumber" in costo) return String(costo.toNumber());
  return String(costo);
}

export default function EditarCapacitacionForm({ capacitacion }: Props) {
  const boundAction = updateCapacitacion.bind(null, capacitacion.id);
  const [state, action, pending] = useActionState(boundAction, null);

  return (
    <form action={action} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Título</label>
          <input
            name="titulo"
            required
            defaultValue={capacitacion.titulo}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Ej: Curso de Kinesiología Deportiva"
          />
          {state?.errors?.titulo?.[0] && (
            <p className="text-xs font-medium text-red-500 mt-1">{state.errors.titulo[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Tipo</label>
          <select
            name="tipo"
            required
            defaultValue={capacitacion.tipo}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option value="CURSO">Curso</option>
            <option value="TALLER">Taller</option>
            <option value="CONGRESO">Congreso</option>
            <option value="ASAMBLEA">Asamblea</option>
          </select>
          {state?.errors?.tipo?.[0] && (
            <p className="text-xs font-medium text-red-500 mt-1">{state.errors.tipo[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Modalidad</label>
          <select
            name="modalidad"
            required
            defaultValue={capacitacion.modalidad}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option value="PRESENCIAL">Presencial</option>
            <option value="VIRTUAL">Virtual</option>
            <option value="HIBRIDO">Híbrido</option>
          </select>
          {state?.errors?.modalidad?.[0] && (
            <p className="text-xs font-medium text-red-500 mt-1">{state.errors.modalidad[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Ubicación o Link</label>
          <input
            name="ubicacion"
            defaultValue={capacitacion.ubicacion ?? ""}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Link de Zoom o Dirección"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Fecha Inicio</label>
          <input
            type="datetime-local"
            name="fechaInicio"
            required
            defaultValue={toDatetimeLocal(capacitacion.fechaInicio)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          {state?.errors?.fechaInicio?.[0] && (
            <p className="text-xs font-medium text-red-500 mt-1">{state.errors.fechaInicio[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Fecha Fin (Opcional)</label>
          <input
            type="datetime-local"
            name="fechaFin"
            defaultValue={toDatetimeLocal(capacitacion.fechaFin)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          {state?.errors?.fechaFin?.[0] && (
            <p className="text-xs font-medium text-red-500 mt-1">{state.errors.fechaFin[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Cupo Máximo (Opcional)</label>
          <input
            type="number"
            name="cupoMaximo"
            min="1"
            defaultValue={capacitacion.cupoMaximo ?? ""}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Sin límite si está vacío"
          />
          {state?.errors?.cupoMaximo?.[0] && (
            <p className="text-xs font-medium text-red-500 mt-1">{state.errors.cupoMaximo[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Costo en ARS (Opcional)</label>
          <input
            type="number"
            name="costo"
            min="0"
            step="0.01"
            defaultValue={toCosto(capacitacion.costo)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Gratis si está vacío"
          />
          {state?.errors?.costo?.[0] && (
            <p className="text-xs font-medium text-red-500 mt-1">{state.errors.costo[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Descripción / Temario</label>
        <textarea
          name="descripcion"
          required
          rows={5}
          defaultValue={capacitacion.descripcion ?? ""}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
          placeholder="Detalles del curso, disertantes, etc."
        />
        {state?.errors?.descripcion?.[0] && (
          <p className="text-xs font-medium text-red-500 mt-1">{state.errors.descripcion[0]}</p>
        )}
      </div>

      <div className="flex items-center gap-3 py-4 border-t border-slate-100">
        <input
          type="checkbox"
          name="publicada"
          id="publicada"
          className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          defaultChecked={capacitacion.publicada}
        />
        <label htmlFor="publicada" className="text-sm font-bold text-slate-900">
          Publicar
        </label>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end gap-4">
        <Link
          href="/admin/capacitaciones"
          className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-60"
        >
          <Save className="mr-2 h-4 w-4" /> {pending ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
