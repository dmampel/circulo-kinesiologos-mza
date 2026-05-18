import { createClient } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { BeneficioRepository } from "@/lib/repositories/BeneficioRepository";
import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";
import { CircularRepository } from "@/lib/repositories/CircularRepository";
import { redirect } from "next/navigation";
import CarnetDigital from "@/components/socio/CarnetDigital";
import QRModal from "@/components/socio/QRModal";

import {
  ArrowUpRight,
  UserCircle,
  AlertCircle,
  BookOpen,
  Calendar,
} from "lucide-react";
import { TurnoRepository } from "@/lib/repositories/TurnoRepository";
import Link from "next/link";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIAS_CORTO = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MESES_CORTO = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function getLunesDeSemana(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function titleCase(str: string) {
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatHora(fecha: Date) {
  const d = new Date(fecha);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}


const MODALIDAD_COLORS: Record<string, { bar: string; bg: string; icon: string }> = {
  PRESENCIAL: { bar: "border-l-blue-500", bg: "bg-blue-50/40", icon: "text-blue-500" },
  VIRTUAL:    { bar: "border-l-emerald-500", bg: "bg-emerald-50/40", icon: "text-emerald-500" },
  HIBRIDO:    { bar: "border-l-violet-500", bg: "bg-violet-50/40", icon: "text-violet-500" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  const beneficios = await BeneficioRepository.findRandom(3);
  const circulares = profesional
    ? await CircularRepository.getAllPublishedWithStatus(profesional.id, 3)
    : [];

  if (!profesional) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-20 w-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mb-8 animate-bounce">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
          Usuario no vinculado
        </h2>
        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
          Tu cuenta no está asociada a un perfil profesional en nuestro padrón
          oficial. Por favor, comunicate con administración para regularizar tu
          situación.
        </p>
      </div>
    );
  }

  const proximasInscripciones =
    await CapacitacionRepository.getProximasInscripcionesSocio(profesional.id);

  const hoy = new Date();
  const lunes = getLunesDeSemana(hoy);
  const turnosSemana = await TurnoRepository.getByProfesionalAndWeek(profesional.id, lunes);

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });

  // ── Unified agenda ────────────────────────────────────────────────────────
  type AgendaItem =
    | { kind: "turno"; id: string; ts: number; hora: string; nombre: string; motivo: string | null; estado: string }
    | { kind: "cap"; id: string; capacitacionId: string; ts: number; hora: string | null; titulo: string; modalidad: string; estadoInscripcion: string };

  function dayKeyAR(date: Date): string {
    const parts = new Intl.DateTimeFormat("es-AR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      timeZone: "America/Argentina/Mendoza",
    }).formatToParts(new Date(date));
    const y = parts.find(p => p.type === "year")!.value;
    const m = parts.find(p => p.type === "month")!.value;
    const d = parts.find(p => p.type === "day")!.value;
    return `${y}-${m}-${d}`;
  }

  const agendaPorDia = new Map<string, AgendaItem[]>();

  for (const t of turnosSemana) {
    const key = dayKeyAR(t.fecha);
    if (!agendaPorDia.has(key)) agendaPorDia.set(key, []);
    agendaPorDia.get(key)!.push({
      kind: "turno",
      id: t.id,
      ts: new Date(t.fecha).getTime(),
      hora: new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Mendoza",
      }).format(new Date(t.fecha)),
      nombre: `${titleCase(t.paciente.apellido)}, ${titleCase(t.paciente.nombre)}`,
      motivo: t.motivo,
      estado: t.estado,
    });
  }

  for (const { id, estado, capacitacion } of proximasInscripciones) {
    const key = dayKeyAR(capacitacion.fechaInicio);
    if (!agendaPorDia.has(key)) agendaPorDia.set(key, []);
    const horaInicio = formatHora(new Date(capacitacion.fechaInicio));
    const horaFin = capacitacion.fechaFin ? formatHora(new Date(capacitacion.fechaFin)) : null;
    agendaPorDia.get(key)!.push({
      kind: "cap",
      id,
      capacitacionId: capacitacion.id,
      ts: new Date(capacitacion.fechaInicio).getTime(),
      hora: horaInicio ? (horaFin ? `${horaInicio} – ${horaFin}` : horaInicio) : null,
      titulo: capacitacion.titulo,
      modalidad: capacitacion.modalidad,
      estadoInscripcion: estado,
    });
  }

  // sort each day's items by time
  for (const items of agendaPorDia.values()) {
    items.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
  }


  const diasConAgenda = Array.from(agendaPorDia.entries())
    .map(([key, items]) => ({ key, items, date: new Date(items[0].ts) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const diasConEventos = diasConAgenda.filter(({ key }) => {
    const [y, m, d] = key.split("-").map(Number);
    return diasSemana.some(wd => wd.getFullYear() === y && wd.getMonth() + 1 === m && wd.getDate() === d);
  });

  const eventosFuera = diasConAgenda.filter(({ key }) => {
    const [y, m, d] = key.split("-").map(Number);
    return !diasSemana.some(wd => wd.getFullYear() === y && wd.getMonth() + 1 === m && wd.getDate() === d);
  });

  const turnosFuera = eventosFuera.reduce((acc, { items }) => acc + items.filter(e => e.kind === "turno").length, 0);
  const capsFuera = eventosFuera.reduce((acc, { items }) => acc + items.filter(e => e.kind === "cap").length, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-5">
      {/* 1. Institutional Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
            Panel Profesional • CKFM
          </p>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            Que bueno verte,{" "}
            <span className="text-blue-600 italic"> {profesional.nombre}</span>
          </h1>
          <p className="text-slate-500 text-md max-w-lg leading-relaxed pt-2">
            Desde acá podés gestionar tu perfil profesional, acceder a tu
            credencial digital y mantenerte informado con las últimas circulares
            institucionales.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-6 shadow-sm shadow-slate-200/50">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Matricula
              </p>
              <p className="text-sm font-black text-slate-900 tracking-tight">
                {profesional.matricula}
              </p>
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Especialidad
              </p>
              <p className="text-xs font-bold text-slate-700">
                {profesional.especialidades.map((e) => e.nombre).join(", ")}
              </p>
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Vencimiento
              </p>
              <p className="text-xs font-bold text-slate-700">Dic 2026</p>
            </div>
            <div className="ml-2 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100">
              Activo
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hero & Carnet */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Digital Card */}
          <div className="lg:col-span-6 flex justify-center lg:justify-start">
            <div
              className="w-full max-w-md group"
              style={{ perspective: "1000px" }}
            >
              <div
                className="transform group-hover:rotate-y-6 transition-transform duration-700 ease-out"
                style={{ transformStyle: "preserve-3d" }}
              >
                <CarnetDigital
                  profesional={profesional}
                  slug={profesional.slug}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Quick Access */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Acceso Rápido
              </h2>
              <div className="space-y-3">
                <Link
                  href="/mi-panel/perfil"
                  className="flex items-center gap-4 p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group w-full"
                >
                  <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                    <UserCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900">
                      Editar Perfil
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Actualizá tus datos de contacto y foto
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-blue-600 transition-colors" />
                </Link>

                <QRModal
                  slug={profesional.slug}
                  nombre={`${profesional.nombre} ${profesional.apellido}`}
                  matricula={profesional.matricula}
                />

                <Link
                  href="/mi-panel/capacitaciones"
                  className="flex items-center gap-4 p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group w-full"
                >
                  <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900">
                      Cursos y Capacitaciones
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Formación continua para profesionales
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-blue-600 transition-colors" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Agenda unificada (turnos + capacitaciones) */}
      {agendaPorDia.size > 0 && (
        <section className="border-t border-slate-100 pt-10">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                Agenda
              </p>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Tu Semana
              </h2>
            </div>
            <Link
              href="/mi-panel/turnos"
              className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:underline"
            >
              Ver agenda
            </Link>
          </div>

          {/* Week strip */}
          <div className="grid grid-cols-7 mb-8">
            {diasSemana.map((dia, i) => {
              const esHoy = isSameDay(dia, hoy);
              const key = `${String(dia.getFullYear())}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`;
              const tieneEventos = agendaPorDia.has(key);
              const tieneTurnos = agendaPorDia.get(key)?.some(e => e.kind === "turno") ?? false;
              return (
                <div key={i} className="flex flex-col items-center gap-1 py-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                    {DIAS_CORTO[dia.getDay()]}
                  </span>
                  <div className={`h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full text-xs sm:text-sm font-black transition-colors ${esHoy ? "bg-blue-600 text-white" : "text-slate-500"}`}>
                    {dia.getDate()}
                  </div>
                  <div className={`h-1 w-1 rounded-full ${tieneEventos ? (tieneTurnos ? "bg-blue-400" : "bg-slate-300") : "opacity-0"}`} />
                </div>
              );
            })}
          </div>

          {/* Unified timeline */}
          <div className="space-y-6">
            {diasConEventos.map(({ key, items, date: diaDate }) => {
              const esHoy = isSameDay(diaDate, hoy);
              return (
                <div key={key}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${esHoy ? "text-blue-600" : "text-slate-400"}`}>
                    {DIAS_CORTO[diaDate.getDay()]} · {diaDate.getDate()} {MESES_CORTO[diaDate.getMonth()]}
                    {esHoy && <span className="ml-2 normal-case tracking-normal font-bold">— Hoy</span>}
                  </p>
                  <div className="space-y-0">
                    {items.map((item, idx) => {
                      if (item.kind === "turno") {
                        const ESTADO_DOT: Record<string, string> = {
                          PENDIENTE: "bg-amber-400", CONFIRMADO: "bg-blue-500",
                          COMPLETADO: "bg-green-500", CANCELADO: "bg-slate-300",
                        };
                        return (
                          <Link
                            key={item.id}
                            href="/mi-panel/turnos"
                            className={`group flex items-center gap-4 py-3 hover:bg-slate-50 -mx-3 px-3 rounded-xl transition-colors cursor-pointer ${idx > 0 ? "border-t border-slate-50" : ""}`}
                          >
                            <div className={`h-2 w-2 rounded-full shrink-0 ${ESTADO_DOT[item.estado] ?? "bg-blue-400"}`} />
                            <span className="text-xs font-bold text-slate-400 tabular-nums shrink-0 w-24">{item.hora}</span>
                            <p className="flex-1 text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors truncate">{item.nombre}</p>
                            {item.motivo && (
                              <span className="text-[11px] text-slate-400 hidden sm:block shrink-0 max-w-[140px] truncate">{item.motivo}</span>
                            )}
                            <ArrowUpRight className="h-3.5 w-3.5 text-slate-200 group-hover:text-blue-400 shrink-0 transition-colors" />
                          </Link>
                        );
                      }
                      const dot = MODALIDAD_COLORS[item.modalidad]?.icon ?? "text-blue-500";
                      return (
                        <Link
                          key={item.id}
                          href={`/mi-panel/capacitaciones/${item.capacitacionId}`}
                          className={`group flex items-center gap-4 py-3 hover:bg-slate-50 -mx-3 px-3 rounded-xl transition-colors ${idx > 0 ? "border-t border-slate-50" : ""}`}
                        >
                          <div className={`h-2 w-2 rounded-full shrink-0 ${dot.replace("text-", "bg-")}`} />
                          <span className="text-xs font-bold text-slate-400 tabular-nums shrink-0 w-24">
                            {item.hora ?? "Sin hora"}
                          </span>
                          <p className="flex-1 text-sm font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                            {item.titulo}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium hidden sm:block shrink-0">
                            {item.modalidad.charAt(0) + item.modalidad.slice(1).toLowerCase()}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-slate-200 group-hover:text-blue-400 shrink-0 transition-colors" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {(turnosFuera > 0 || capsFuera > 0) && (
              <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
                {turnosFuera > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    <p className="text-[11px] text-slate-400">
                      {turnosFuera} {turnosFuera === 1 ? "turno" : "turnos"} la próxima semana
                    </p>
                  </div>
                )}
                {capsFuera > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    <p className="text-[11px] text-slate-400">
                      {capsFuera} {capsFuera === 1 ? "capacitación" : "capacitaciones"} la próxima semana
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 border-t border-slate-100 pt-10">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Circulares Institucionales
            </h2>
            <Link
              href="/mi-panel/circulares"
              className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
            >
              Ver historial
            </Link>
          </div>

          <div className="space-y-0 relative before:absolute before:left-[9px] sm:before:left-[11px] before:top-4 before:bottom-4 before:w-[1px] before:bg-slate-100">
            {circulares.length === 0 ? (
              <div className="pl-10 text-slate-400 text-sm italic py-4">No hay circulares publicadas por el momento.</div>
            ) : circulares.map((circular) => {
              const isRead = (circular as any).lecturas?.length > 0;
              return (
              <div key={circular.id} className="group relative pl-8 sm:pl-10 py-6 first:pt-0">
                <div className={`absolute left-0 top-[38px] h-[22px] w-[22px] rounded-full border-4 border-white z-10 transition-colors ${isRead ? "bg-slate-200" : "bg-blue-600 animate-pulse"}`} />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" }).format(circular.publicada_en || circular.createdAt)}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isRead ? "text-slate-400" : "text-blue-600"}`}>
                      {circular.etiqueta}
                    </span>
                  </div>
                  <Link href={`/mi-panel/circulares/${circular.id}`} className="block">
                    <h3 className={`text-lg font-bold leading-tight transition-colors ${isRead ? "text-slate-400" : "text-slate-900 group-hover:text-blue-700"}`}>
                      {circular.titulo}
                    </h3>
                  </Link>
                  <Link
                    href={`/mi-panel/circulares/${circular.id}`}
                    className="inline-flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors pt-1"
                  >
                    Ver más <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            );})}
          </div>
        </div>

        {/* Right Column: Beneficios + Soporte */}
        <aside className="lg:col-span-4 space-y-6">
          {beneficios.length > 0 && (
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[1.5rem] bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tus Beneficios
                </h3>
                <Link
                  href="/kineclub"
                  className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
                >
                  Ver todos
                </Link>
              </div>
              <div className="space-y-4">
                {beneficios.map((b) => (
                  <div key={b.id} className="flex items-start gap-3">
                    {/* Logo o fallback con inicial */}
                    <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {b.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.logo_url}
                          alt={b.empresa}
                          className="object-contain w-full h-full p-1"
                        />
                      ) : (
                        <span className="text-sm font-black text-slate-400 uppercase">
                          {b.empresa.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">
                        {b.empresa}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        {b.descripcion}
                      </p>
                      {b.descuento && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded-full border border-green-100">
                          {b.descuento}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[1.5rem] bg-slate-50 border border-slate-100 shadow-sm relative overflow-hidden">
            <h5 className="text-[9px] font-black uppercase tracking-widest mb-3 text-slate-400">
              Soporte
            </h5>
            <p className="text-xs font-bold text-slate-900 mb-4">
              ¿Dudas administrativas?
            </p>
            <Link
              href="#"
              className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 hover:border-blue-200 hover:text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
            >
              Contactar
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
