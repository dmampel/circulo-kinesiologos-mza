import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { PacienteRepository } from "@/lib/repositories/PacienteRepository";
import { HistoriaClinicaRepository } from "@/lib/repositories/HistoriaClinicaRepository";
import { TurnoRepository } from "@/lib/repositories/TurnoRepository";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  Shield,
  FileText,
  Plus,
  Pencil,
  CalendarDays,
  Clock,
} from "lucide-react";
import DeleteEntradaButton from "./historia-clinica/_components/DeleteEntradaButton";

export const dynamic = "force-dynamic";

function formatFecha(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatFechaTurno(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

const ESTADO_TURNO_STYLES: Record<string, string> = {
  PENDIENTE: "bg-amber-50 text-amber-600",
  CONFIRMADO: "bg-emerald-50 text-emerald-600",
  CANCELADO: "bg-red-50 text-red-500",
  COMPLETADO: "bg-slate-100 text-slate-500",
};

export default async function DetallePacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  const paciente = await PacienteRepository.findById(id, profesional.id);
  if (!paciente) notFound();

  const [entradas, turnos] = await Promise.all([
    HistoriaClinicaRepository.findAllByPaciente(id),
    TurnoRepository.findByPaciente(id, profesional.id),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      {/* Breadcrumb */}
      <Link
        href="/mi-panel/turnos/pacientes"
        className="flex items-center text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Mis Pacientes
      </Link>

      {/* Header paciente */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl shrink-0">
              {paciente.apellido.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
                Paciente
              </p>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter break-words">
                {paciente.apellido}, {paciente.nombre}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {paciente.telefono && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Phone className="h-3 w-3" /> {paciente.telefono}
                  </span>
                )}
                {paciente.email && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Mail className="h-3 w-3" /> {paciente.email}
                  </span>
                )}
                {paciente.obraSocial && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Shield className="h-3 w-3" /> {paciente.obraSocial}
                  </span>
                )}
              </div>
              {paciente.notas && (
                <p className="mt-2 text-xs text-slate-400 font-medium max-w-md">
                  {paciente.notas}
                </p>
              )}
            </div>
          </div>
          <Link
            href={`/mi-panel/turnos/pacientes/${id}/editar`}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-black text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all shrink-0 self-start"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historia Clínica — columna principal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                Historia Clínica
              </h2>
              <span className="text-[10px] font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full">
                {entradas.length}
              </span>
            </div>
            <Link
              href={`/mi-panel/turnos/pacientes/${id}/historia-clinica/nueva`}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <Plus className="h-3.5 w-3.5" /> Nueva Entrada
            </Link>
          </div>

          {entradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <FileText className="h-10 w-10 text-slate-200 mb-3" />
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-tight">
                Sin entradas todavía
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                Registrá la primera evolución del paciente.
              </p>
              <Link
                href={`/mi-panel/turnos/pacientes/${id}/historia-clinica/nueva`}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-2xl hover:bg-emerald-700 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Primera Entrada
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {entradas.map((entrada) => (
                <div
                  key={entrada.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-emerald-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                          {formatFecha(entrada.fecha)}
                        </span>
                      </div>
                      {entrada.motivo && (
                        <p className="text-xs font-black text-slate-900 mb-1.5">
                          {entrada.motivo}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                        {entrada.evolucion}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/mi-panel/turnos/pacientes/${id}/historia-clinica/${entrada.id}/editar`}
                        className="p-2 rounded-xl text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                        title="Editar entrada"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <DeleteEntradaButton entradaId={entrada.id} pacienteId={id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Turnos — columna lateral */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">
              Turnos
            </h2>
            <span className="text-[10px] font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full">
              {turnos.length}
            </span>
          </div>

          {turnos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Clock className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Sin turnos registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {turnos.map((turno) => (
                <div
                  key={turno.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                >
                  <p className="text-xs font-black text-slate-900">
                    {formatFechaTurno(turno.fecha)}
                  </p>
                  {turno.motivo && (
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {turno.motivo}
                    </p>
                  )}
                  <span
                    className={`inline-block mt-2 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      ESTADO_TURNO_STYLES[turno.estado] ?? "bg-slate-50 text-slate-500"
                    }`}
                  >
                    {turno.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
