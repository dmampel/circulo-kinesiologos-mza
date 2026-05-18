"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import TurnoDetailModal, { TurnoConPacienteDetalle } from "./_components/TurnoDetailModal";

type TurnoConPaciente = TurnoConPacienteDetalle;

// ─── Grid constants ───────────────────────────────────────────────────────────
const START_HOUR = 6;
const END_HOUR = 22;
const PX_PER_MIN = 1.5;          // 90px per hour
const HOUR_HEIGHT = 60 * PX_PER_MIN;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const DIAS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

const ESTADO_STYLES: Record<string, { card: string; dot: string }> = {
  PENDIENTE:  { card: "bg-amber-50 border-amber-200 text-amber-700",   dot: "bg-amber-400" },
  CONFIRMADO: { card: "bg-blue-50 border-blue-200 text-blue-700",      dot: "bg-blue-500" },
  COMPLETADO: { card: "bg-green-50 border-green-200 text-green-700",   dot: "bg-green-500" },
  CANCELADO:  { card: "bg-slate-50 border-slate-200 text-slate-400",   dot: "bg-slate-300" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getARTime(date: Date): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("es-AR", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    timeZone: "America/Argentina/Mendoza",
  }).formatToParts(new Date(date));
  return {
    hours:   parseInt(parts.find((p) => p.type === "hour")?.value   ?? "0"),
    minutes: parseInt(parts.find((p) => p.type === "minute")?.value ?? "0"),
  };
}

function formatRango(a: Date, b: Date) {
  const fmt = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Argentina/Mendoza",
  });
  return `${fmt.format(new Date(a))} — ${fmt.format(new Date(b))}`;
}

function titleCase(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function isSameDayAR(a: Date, b: Date) {
  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("es-AR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      timeZone: "America/Argentina/Mendoza",
    }).format(new Date(d));
  return fmtDate(a) === fmtDate(b);
}

// ─── Component ────────────────────────────────────────────────────────────────
type Paciente = { id: string; nombre: string; apellido: string };

interface AgendaSemanalProps {
  turnos: TurnoConPaciente[];
  weekStartISO: string;
  pacientes: Paciente[];
}

export default function AgendaSemanal({ turnos, weekStartISO, pacientes }: AgendaSemanalProps) {
  const router = useRouter();
  const weekStart = new Date(weekStartISO);

  const [localTurnos, setLocalTurnos] = useState<TurnoConPaciente[]>(turnos);
  const [selectedTurno, setSelectedTurno] = useState<TurnoConPaciente | null>(null);

  useEffect(() => {
    setLocalTurnos(turnos);
  }, [turnos]);

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    d.setUTCHours(12, 0, 0, 0);
    return d;
  });

  const hoy = new Date();

  function navegar(offset: number) {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + offset * 7);
    router.push(`/mi-panel/turnos?semana=${d.toISOString().split("T")[0]}`);
  }

  function handleEstadoChange(id: string, nuevoEstado: TurnoConPaciente["estado"]) {
    setLocalTurnos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, estado: nuevoEstado } : t))
    );
    setSelectedTurno((prev) =>
      prev?.id === id ? { ...prev, estado: nuevoEstado } : prev
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Navigation bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navegar(-1)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-black text-slate-900">
            {formatRango(diasSemana[0], diasSemana[6])}
          </span>
          <button
            onClick={() => navegar(1)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Link
          href="/mi-panel/turnos/nuevo"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="h-4 w-4" />
          Nuevo Turno
        </Link>
      </div>

      {/* ── Calendar grid ── */}
      <div className="bg-white rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="flex border-b border-slate-100">
          <div className="w-14 shrink-0 border-r border-slate-100" />
          {diasSemana.map((dia, i) => {
            const esHoy = isSameDayAR(dia, hoy);
            return (
              <div
                key={i}
                className={`flex-1 flex flex-col items-center py-3 border-r border-slate-100 last:border-r-0 ${
                  esHoy ? "bg-blue-600" : ""
                }`}
              >
                <span
                  className={`text-[9px] font-black uppercase tracking-widest ${
                    esHoy ? "text-blue-200" : "text-slate-400"
                  }`}
                >
                  {DIAS[i]}
                </span>
                <span
                  className={`text-base font-black leading-tight ${
                    esHoy ? "text-white" : "text-slate-800"
                  }`}
                >
                  {dia.getUTCDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Scrollable time body */}
        <div
          className="overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{ height: "calc(100vh - 240px)", scrollbarWidth: "none" }}
        >
          <div className="flex">
            {/* Time labels */}
            <div
              className="w-14 shrink-0 relative border-r border-slate-100"
              style={{ height: TOTAL_HEIGHT }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-2 text-[10px] font-bold text-slate-300 tabular-nums"
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT + (h === START_HOUR ? 4 : -8) }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {diasSemana.map((dia, i) => {
              const turnosDia = localTurnos
                .filter((t) => isSameDayAR(new Date(t.fecha), dia))
                .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

              return (
                <div
                  key={i}
                  className="flex-1 relative border-r border-slate-100 last:border-r-0"
                  style={{ height: TOTAL_HEIGHT }}
                >
                  {/* Hour grid lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-slate-100"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                    />
                  ))}
                  {/* Half-hour lines */}
                  {HOURS.map((h) => (
                    <div
                      key={`${h}h`}
                      className="absolute left-0 right-0 border-t border-dashed border-slate-50"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                    />
                  ))}

                  {/* Turnos */}
                  {turnosDia.map((t) => {
                    const { hours, minutes } = getARTime(new Date(t.fecha));
                    const startMin = (hours - START_HOUR) * 60 + minutes;
                    const top = startMin * PX_PER_MIN;
                    const height = Math.max(t.duracion * PX_PER_MIN, 48);
                    const style = ESTADO_STYLES[t.estado] ?? ESTADO_STYLES.PENDIENTE;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTurno(t)}
                        className={`absolute inset-x-1 rounded-xl border px-2 py-1.5 overflow-hidden hover:shadow-md transition-shadow text-left w-[calc(100%-8px)] ${style.card}`}
                        style={{ top, height }}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
                          <p className="text-[11px] font-bold leading-tight truncate">
                            {titleCase(t.paciente.nombre)} {titleCase(t.paciente.apellido)}
                          </p>
                        </div>
                        {t.motivo && (
                          <p className="text-[10px] opacity-60 truncate mt-0.5">{t.motivo}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Turno detail modal ── */}
      <AnimatePresence>
        {selectedTurno && (
          <TurnoDetailModal
            key={selectedTurno.id}
            turno={selectedTurno}
            pacientes={pacientes}
            onClose={() => setSelectedTurno(null)}
            onEstadoChange={handleEstadoChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
