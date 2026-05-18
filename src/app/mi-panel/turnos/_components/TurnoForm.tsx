"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, Save, ChevronDown } from "lucide-react";
import { crearTurno, actualizarTurno, cambiarEstadoTurno, eliminarTurno } from "../actions";
import { EstadoTurno } from "@prisma/client";

type Paciente = { id: string; nombre: string; apellido: string };

interface TurnoFormProps {
  pacientes: Paciente[];
  id?: string;
  initialValues?: {
    pacienteId: string;
    fecha: string;
    hora: string;
    duracion: number;
    motivo?: string | null;
    notas?: string | null;
    estado?: EstadoTurno;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const ESTADOS: { value: EstadoTurno; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "COMPLETADO", label: "Completado" },
  { value: "CANCELADO", label: "Cancelado" },
];

export default function TurnoForm({ pacientes, id, initialValues, onSuccess, onCancel }: TurnoFormProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [fechaValue, setFechaValue] = useState(
    initialValues?.fecha ?? toDateInputValue(new Date())
  );
  const [horaValue, setHoraValue] = useState(initialValues?.hora ?? "");
  const router = useRouter();
  const isEditing = !!id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);

    const formData = new FormData(e.currentTarget);
    const result = isEditing
      ? await actualizarTurno(id, formData)
      : await crearTurno(formData);

    if (result.success) {
      if ("warning" in result && result.warning) {
        setWarning(result.warning);
        setLoading(false);
        if (onSuccess) {
          setTimeout(onSuccess, 1500);
        } else {
          setTimeout(() => router.push("/mi-panel/turnos"), 2000);
        }
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/mi-panel/turnos");
        }
      }
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    const ok = confirm("¿Eliminar este turno?");
    if (!ok) return;
    setDeleting(true);
    const result = await eliminarTurno(id);
    if (result.success) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/mi-panel/turnos");
      }
    } else {
      alert("Error: " + result.error);
      setDeleting(false);
    }
  }

  async function handleEstado(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!id) return;
    const result = await cambiarEstadoTurno(id, e.target.value as EstadoTurno);
    if (!result.success) alert("Error: " + result.error);
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-blue-900/5 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
          {isEditing ? <Save className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
        </div>
        <div>
          <h3 className="font-black text-slate-900 uppercase tracking-tight">
            {isEditing ? "Editar Turno" : "Nuevo Turno"}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {isEditing ? "Actualizar datos" : "Agendar paciente"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Paciente */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Paciente <span className="text-red-400">*</span>
          </label>
          {pacientes.length === 0 ? (
            <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl text-sm font-bold text-amber-600">
              No tenés pacientes registrados.{" "}
              <a href="/mi-panel/turnos/pacientes/nuevo" className="underline">
                Crear paciente
              </a>
            </div>
          ) : (
            <div className="relative">
              <select
                name="pacienteId"
                required
                defaultValue={initialValues?.pacienteId ?? ""}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm font-bold outline-none transition-all appearance-none pr-10"
              >
                <option value="">Seleccioná un paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.apellido}, {p.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Fecha + Hora */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Fecha <span className="text-red-400">*</span>
            </label>
            <input
              name="fecha"
              type="date"
              required
              value={fechaValue}
              onChange={(e) => setFechaValue(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm font-bold outline-none transition-all"
            />
            {!isEditing && (
              <div className="flex gap-1.5 pt-1">
                {[
                  { label: "Hoy", offset: 0 },
                  { label: "Mañana", offset: 1 },
                  { label: "Pasado", offset: 2 },
                ].map(({ label, offset }) => {
                  const val = toDateInputValue(addDays(new Date(), offset));
                  const active = fechaValue === val;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFechaValue(val)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Hora <span className="text-red-400">*</span>
            </label>
            <input
              name="hora"
              type="time"
              required
              min="06:00"
              max="21:59"
              value={horaValue}
              onChange={(e) => setHoraValue(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm font-bold outline-none transition-all"
            />
            {!isEditing && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["08:00","09:00","10:00","11:00","14:00","15:00","16:00","17:00"].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHoraValue(h)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                      horaValue === h
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Duración */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Duración (minutos)
          </label>
          <input
            name="duracion"
            type="number"
            min={5}
            max={480}
            defaultValue={initialValues?.duracion ?? 50}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm font-bold outline-none transition-all"
          />
        </div>

        {/* Motivo */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Motivo de consulta
          </label>
          <input
            name="motivo"
            defaultValue={initialValues?.motivo ?? ""}
            placeholder="Ej: Lumbalgia, rehabilitación rodilla..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm font-bold outline-none transition-all"
          />
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Notas
          </label>
          <textarea
            name="notas"
            rows={3}
            defaultValue={initialValues?.notas ?? ""}
            placeholder="Observaciones del turno..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm font-bold outline-none transition-all resize-none"
          />
        </div>

        {/* Estado (solo edición) */}
        {isEditing && initialValues?.estado && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Estado
            </label>
            <div className="relative">
              <select
                defaultValue={initialValues.estado}
                onChange={handleEstado}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm font-bold outline-none transition-all appearance-none pr-10"
              >
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        {warning && (
          <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl text-sm font-bold text-amber-600">
            {warning}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || pacientes.length === 0}
          className="w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
        >
          {loading ? "Guardando..." : (
            <>
              {isEditing ? "Guardar Cambios" : "Confirmar Turno"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full flex items-center justify-center px-6 py-3 rounded-2xl border border-red-100 text-red-400 text-sm font-black hover:bg-red-50 transition-all disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Eliminar Turno"}
          </button>
        )}
      </form>
    </div>
  );
}
