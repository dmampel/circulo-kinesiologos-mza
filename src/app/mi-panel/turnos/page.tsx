import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { TurnoRepository } from "@/lib/repositories/TurnoRepository";
import { PacienteRepository } from "@/lib/repositories/PacienteRepository";
import AgendaSemanal from "./AgendaSemanal";

function getLunesDeSemana(ref: Date): Date {
  const d = new Date(ref);
  d.setUTCHours(0, 0, 0, 0);
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function isSameDayAR(a: Date, b: Date) {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("es-AR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      timeZone: "America/Argentina/Mendoza",
    }).format(d);
  return fmt(a) === fmt(b);
}

function formatHoraAR(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Mendoza",
  }).format(date);
}

function titleCase(str: string) {
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const { semana } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  const weekStart = getLunesDeSemana(semana ? new Date(semana) : new Date());
  const [turnos, pacientes] = await Promise.all([
    TurnoRepository.getByProfesionalAndWeek(profesional.id, weekStart),
    PacienteRepository.findAll(profesional.id),
  ]);

  const hoy = new Date();
  const turnosHoy = turnos.filter((t) => isSameDayAR(new Date(t.fecha), hoy));
  const turnosSemana = turnos.length;

  const proximo = turnos
    .filter((t) => new Date(t.fecha) > hoy && t.estado !== "CANCELADO")
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0];

  function getDayLabel(date: Date): string {
    const mañana = new Date(hoy); mañana.setDate(hoy.getDate() + 1);
    const pasado = new Date(hoy); pasado.setDate(hoy.getDate() + 2);
    if (isSameDayAR(date, hoy)) return "Hoy";
    if (isSameDayAR(date, mañana)) return "Mañana";
    if (isSameDayAR(date, pasado)) return "Pasado";
    return new Intl.DateTimeFormat("es-AR", {
      weekday: "long", timeZone: "America/Argentina/Mendoza",
    }).format(date).replace(/^\w/, (c) => c.toUpperCase());
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header + síntesis */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">
            Mi Panel · Gestión
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            Mis Turnos
          </h1>
        </div>

        <div className="flex items-center gap-3 pb-1">
          {/* Hoy */}
          <div className="px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[110px]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hoy</p>
            <p className="text-2xl font-black text-slate-900 leading-none tabular-nums">
              {turnosHoy.length}
              <span className="text-sm font-bold text-slate-400 ml-1">
                {turnosHoy.length === 1 ? "turno" : "turnos"}
              </span>
            </p>
          </div>

          {/* Semana */}
          <div className="px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[130px]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Esta semana</p>
            <p className="text-2xl font-black text-slate-900 leading-none tabular-nums">
              {turnosSemana}
              <span className="text-sm font-bold text-slate-400 ml-1">
                {turnosSemana === 1 ? "turno" : "turnos"}
              </span>
            </p>
          </div>

          {/* Próximo */}
          {proximo && (
            <div className="px-5 py-3 bg-blue-50 border border-blue-100 rounded-2xl shadow-sm">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Próximo</p>
              <p className="text-sm font-black text-blue-700 leading-tight">
                {getDayLabel(new Date(proximo.fecha))}
                <span className="text-blue-400 font-bold mx-1">·</span>
                {formatHoraAR(new Date(proximo.fecha))}
              </p>
              <p className="text-[11px] text-blue-500 font-bold truncate max-w-[140px]">
                {titleCase((proximo as any).paciente.nombre)} {titleCase((proximo as any).paciente.apellido)}
              </p>
            </div>
          )}
        </div>
      </div>

      <AgendaSemanal turnos={turnos as any} weekStartISO={weekStart.toISOString()} pacientes={pacientes} />
    </div>
  );
}
