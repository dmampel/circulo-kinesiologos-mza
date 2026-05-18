"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Phone, Mail, Edit2, Calendar, Clock, ArrowLeft } from "lucide-react";
import { EstadoTurno } from "@prisma/client";
import { cambiarEstadoTurno } from "../actions";
import TurnoForm from "./TurnoForm";

export type TurnoConPacienteDetalle = {
  id: string;
  fecha: Date;
  duracion: number;
  motivo: string | null;
  notas: string | null;
  estado: EstadoTurno;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    telefono: string | null;
    email: string | null;
  };
};

type Paciente = { id: string; nombre: string; apellido: string };

type Props = {
  turno: TurnoConPacienteDetalle;
  pacientes: Paciente[];
  onClose: () => void;
  onEstadoChange: (id: string, estado: EstadoTurno) => void;
};

const ESTADO_BADGE: Record<EstadoTurno, { bg: string; text: string; label: string }> = {
  PENDIENTE:  { bg: "bg-amber-100",  text: "text-amber-700",  label: "Pendiente" },
  CONFIRMADO: { bg: "bg-blue-100",   text: "text-blue-700",   label: "Confirmado" },
  COMPLETADO: { bg: "bg-green-100",  text: "text-green-700",  label: "Completado" },
  CANCELADO:  { bg: "bg-slate-100",  text: "text-slate-500",  label: "Cancelado" },
};

const ESTADO_BTN: Record<EstadoTurno, { active: string; idle: string; label: string }> = {
  PENDIENTE:  { active: "bg-amber-500 text-white border-amber-500",  idle: "border-amber-200 text-amber-600 hover:bg-amber-50",  label: "Pendiente" },
  CONFIRMADO: { active: "bg-blue-600 text-white border-blue-600",    idle: "border-blue-200 text-blue-600 hover:bg-blue-50",    label: "Confirmar" },
  COMPLETADO: { active: "bg-green-600 text-white border-green-600",  idle: "border-green-200 text-green-600 hover:bg-green-50", label: "Completar" },
  CANCELADO:  { active: "bg-slate-500 text-white border-slate-500",  idle: "border-slate-200 text-slate-500 hover:bg-slate-50", label: "Cancelar" },
};

function formatWhatsappNumber(tel: string): string {
  let clean = tel.replace(/\D/g, "");
  if (clean.startsWith("549")) return clean;
  if (clean.startsWith("54")) return "549" + clean.slice(2);
  if (clean.startsWith("0")) clean = clean.slice(1);
  return "549" + clean;
}

function formatFecha(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Mendoza",
  }).format(new Date(date));
}

function formatHora(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Mendoza",
  }).format(new Date(date));
}

function titleCase(str: string) {
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function TurnoDetailModal({ turno, pacientes, onClose, onEstadoChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"detail" | "edit">("detail");

  const badge = ESTADO_BADGE[turno.estado];
  const horaInicio = formatHora(turno.fecha);
  const horaFin = formatHora(new Date(new Date(turno.fecha).getTime() + turno.duracion * 60 * 1000));

  async function handleEstado(estado: EstadoTurno) {
    if (loading || estado === turno!.estado) return;
    setLoading(true);
    const result = await cambiarEstadoTurno(turno!.id, estado);
    if (result.success) {
      onEstadoChange(turno!.id, estado);
    }
    setLoading(false);
  }

  function handleClose() {
    setMode("detail");
    onClose();
  }

  const initialValues = {
    pacienteId: turno.paciente.id,
    fecha: new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Mendoza",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date(turno.fecha)),
    hora: formatHora(turno.fecha),
    duracion: turno.duracion,
    motivo: turno.motivo,
    notas: turno.notas,
    estado: turno.estado,
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={handleClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Slide-over panel */}
      <motion.div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
        style={{ willChange: "transform" }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 200, mass: 0.8 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {mode === "edit" && (
              <button
                onClick={() => setMode("detail")}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {mode === "edit" ? "Editar turno" : "Detalle del turno"}
              </p>
              <h2 className="text-xl font-black text-slate-900">
                {titleCase(turno.paciente.nombre)} {titleCase(turno.paciente.apellido)}
              </h2>
              {mode === "detail" && (
                <span
                  className={`inline-flex items-center mt-2 px-3 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}
                >
                  {badge.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {mode === "edit" ? (
            <TurnoForm
              pacientes={pacientes}
              id={turno.id}
              initialValues={initialValues}
              onSuccess={handleClose}
              onCancel={() => setMode("detail")}
            />
          ) : (
            <>
              {/* Turno info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-medium capitalize">{formatFecha(turno.fecha)}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-medium">
                    {horaInicio} – {horaFin}{" "}
                    <span className="text-slate-400">({turno.duracion} min)</span>
                  </span>
                </div>
                {turno.motivo && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Motivo</p>
                    <p className="text-sm text-slate-700">{turno.motivo}</p>
                  </div>
                )}
                {turno.notas && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notas</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{turno.notas}</p>
                  </div>
                )}
              </div>

              {/* Contact */}
              {(turno.paciente.telefono || turno.paciente.email) && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Contactar paciente
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {turno.paciente.telefono && (
                      <a
                        href={`https://wa.me/${formatWhatsappNumber(turno.paciente.telefono)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        WhatsApp
                      </a>
                    )}
                    {turno.paciente.email && (
                      <a
                        href={`mailto:${turno.paciente.email}`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-100 transition-colors border border-blue-100"
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Estado */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Estado del turno
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["PENDIENTE", "CONFIRMADO", "COMPLETADO", "CANCELADO"] as EstadoTurno[]).map((estado) => {
                    const btn = ESTADO_BTN[estado];
                    const isActive = turno.estado === estado;
                    return (
                      <button
                        key={estado}
                        onClick={() => handleEstado(estado)}
                        disabled={loading}
                        className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-all disabled:opacity-50 ${
                          isActive ? btn.active : btn.idle
                        }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer — solo en modo detalle */}
        {mode === "detail" && (
          <div className="p-6 border-t border-slate-100">
            <button
              onClick={() => setMode("edit")}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Editar turno
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
