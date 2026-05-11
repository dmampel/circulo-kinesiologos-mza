import { createClient } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { BeneficioRepository } from "@/lib/repositories/BeneficioRepository";
import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";
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

function formatHora(fecha: Date) {
  const d = new Date(fecha);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === "CONFIRMADA")
    return (
      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-100">
        Confirmada
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
      Pendiente
    </span>
  );
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
  const beneficios = await BeneficioRepository.findFeatured(3);

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
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });

  const eventosPorDia = new Map<string, typeof proximasInscripciones>();
  for (const insc of proximasInscripciones) {
    const d = new Date(insc.capacitacion.fechaInicio);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!eventosPorDia.has(key)) eventosPorDia.set(key, []);
    eventosPorDia.get(key)!.push(insc);
  }

  const diasConEventos = Array.from(
    new Map(
      proximasInscripciones.map(({ capacitacion }) => {
        const d = new Date(capacitacion.fechaInicio);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        return [key, d];
      })
    )
  ).sort(([, a], [, b]) => a.getTime() - b.getTime());

  const eventosFuera = proximasInscripciones.filter(({ capacitacion }) => {
    const d = new Date(capacitacion.fechaInicio);
    return !diasSemana.some((wd) => isSameDay(d, wd));
  });

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-5">
      {/* 1. Institutional Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
            Panel Profesional • CKM
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
                M.P. {profesional.matricula}
              </p>
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Especialidad
              </p>
              <p className="text-xs font-bold text-slate-700">
                Kinesiología Gral.
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
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
                  className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group w-full"
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
                  className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group w-full"
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

      {/* 3. Agenda Semanal */}
      {proximasInscripciones.length > 0 && (
        <section className="border-t border-slate-100 pt-10">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                Agenda
              </p>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Tu agenda
              </h2>
            </div>
            <Link
              href="/mi-panel/capacitaciones"
              className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {/* Week strip — sin card, solo la franja */}
          <div className="grid grid-cols-7 mb-8">
            {diasSemana.map((dia, i) => {
              const esHoy = isSameDay(dia, hoy);
              const tieneEvento = proximasInscripciones.some(({ capacitacion }) =>
                isSameDay(new Date(capacitacion.fechaInicio), dia)
              );
              return (
                <div key={i} className="flex flex-col items-center gap-1 py-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                    {DIAS_CORTO[dia.getDay()]}
                  </span>
                  <div className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-black transition-colors ${esHoy ? "bg-blue-600 text-white" : "text-slate-500"}`}>
                    {dia.getDate()}
                  </div>
                  <div className={`h-1 w-1 rounded-full ${tieneEvento ? (esHoy ? "bg-blue-400" : "bg-slate-300") : "opacity-0"}`} />
                </div>
              );
            })}
          </div>

          {/* Events list grouped by day — agenda style, no cards */}
          <div className="space-y-6">
              {diasConEventos.map(([key, diaDate]) => {
                const eventos = eventosPorDia.get(key) ?? [];
                const esHoy = isSameDay(diaDate, hoy);
                return (
                  <div key={key}>
                    {/* Day label */}
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${esHoy ? "text-blue-600" : "text-slate-400"}`}>
                      {DIAS_CORTO[diaDate.getDay()]} · {diaDate.getDate()} {MESES_CORTO[diaDate.getMonth()]}
                      {esHoy && <span className="ml-2 normal-case tracking-normal font-bold">— Hoy</span>}
                    </p>

                    <div className="space-y-0">
                      {eventos.map(({ id, estado, capacitacion }, idx) => {
                        const horaInicio = formatHora(new Date(capacitacion.fechaInicio));
                        const horaFin = capacitacion.fechaFin
                          ? formatHora(new Date(capacitacion.fechaFin))
                          : null;
                        const dot = MODALIDAD_COLORS[capacitacion.modalidad]?.icon ?? "text-blue-500";
                        return (
                          <Link
                            key={id}
                            href={`/mi-panel/capacitaciones/${capacitacion.id}`}
                            className={`group flex items-center gap-4 py-3 hover:bg-slate-50 -mx-3 px-3 rounded-xl transition-colors ${idx > 0 ? "border-t border-slate-50" : ""}`}
                          >
                            <div className={`h-2 w-2 rounded-full shrink-0 ${dot.replace("text-", "bg-")}`} />
                            {horaInicio ? (
                              <span className="text-xs font-bold text-slate-400 tabular-nums shrink-0 w-24">
                                {horaInicio}{horaFin ? <> – {horaFin}</> : null}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300 shrink-0 w-24">Sin hora</span>
                            )}
                            <p className="flex-1 text-sm font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                              {capacitacion.titulo}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium hidden sm:block shrink-0">
                              {capacitacion.modalidad.charAt(0) + capacitacion.modalidad.slice(1).toLowerCase()}
                            </span>
                            {estado === "PENDIENTE" && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 shrink-0">
                                Pendiente
                              </span>
                            )}
                            <ArrowUpRight className="h-3.5 w-3.5 text-slate-200 group-hover:text-blue-400 shrink-0 transition-colors" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {eventosFuera.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Calendar className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  <p className="text-[11px] text-slate-400">
                    {eventosFuera.length} capacitación{eventosFuera.length > 1 ? "es" : ""} más próximamente
                  </p>
                </div>
              )}
          </div>
        </section>
      )}

      {/* 4. Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 border-t border-slate-100 pt-10">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Circulares Institucionales
            </h2>
            <Link
              href="/novedades"
              className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
            >
              Ver historial
            </Link>
          </div>

          <div className="space-y-0 relative before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-[1px] before:bg-slate-100">
            {[
              {
                title: "Actualización del Vademécum y Convenios de Prestación",
                date: "12 de Mayo, 2026",
                tag: "Circular Nº 124",
              },
              {
                title: "Convocatoria a Asamblea Anual de Socios",
                date: "08 de Mayo, 2026",
                tag: "Institucional",
              },
              {
                title: "Nuevas medidas de bioseguridad en consultorios",
                date: "05 de Mayo, 2026",
                tag: "Salud",
              },
            ].map((news, i) => (
              <div key={i} className="group relative pl-10 py-6 first:pt-0">
                <div className="absolute left-0 top-[38px] first:top-[38px] h-[22px] w-[22px] rounded-full border-4 border-white bg-slate-100 group-hover:bg-blue-600 transition-colors z-10" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {news.date}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                      {news.tag}
                    </span>
                  </div>
                  <Link href={`/novedades/${i}`} className="block">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
                      {news.title}
                    </h3>
                  </Link>
                  <Link
                    href="#"
                    className="inline-flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors pt-1"
                  >
                    Ver más <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Beneficios + Soporte */}
        <aside className="lg:col-span-4 space-y-6">
          {beneficios.length > 0 && (
            <div className="p-6 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm">
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

          <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 shadow-sm relative overflow-hidden">
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
