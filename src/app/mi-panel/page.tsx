import { createClient } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { BeneficioRepository } from "@/lib/repositories/BeneficioRepository";
import { redirect } from "next/navigation";
import CarnetDigital from "@/components/socio/CarnetDigital";
import QRModal from "@/components/socio/QRModal";
import {
  ArrowUpRight,
  UserCircle,
  AlertCircle,
  Star,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

      {/* 2. Hero & Carnet - Swapped Layout */}
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
                <CarnetDigital profesional={profesional} slug={profesional.slug} />
              </div>
            </div>
          </div>

          {/* Right Column: Quick Access Shortcuts */}
          <div className="lg:col-span-6 space-y-8">
            {/* Acceso Rápido */}
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
                  <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900">Editar Perfil</p>
                  <p className="text-[11px] text-slate-400 font-medium">Actualizá tus datos de contacto y foto</p>
                </div>
                <ArrowUpRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-blue-600 transition-colors" />
              </Link>

              <QRModal
                slug={profesional.slug}
                nombre={`${profesional.nombre} ${profesional.apellido}`}
                matricula={profesional.matricula}
              />

<div className="relative flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl opacity-50 cursor-not-allowed w-full">
                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Cursos y Capacitaciones</p>
                  <p className="text-[11px] text-slate-400 font-medium">Formación continua para profesionales</p>
                </div>
                <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg shrink-0">
                  Próximamente
                </span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* 3. Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 border-t border-slate-100 pt-10">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Circulares Institucionales
            </h2>
            <Link
              href="/novedades"
              className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:underline"
            >
              Ver Historial
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
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tus Beneficios</h3>
                <Link
                  href="/kineclub"
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                >
                  Ver todos
                </Link>
              </div>
              <div className="space-y-4">
                {beneficios.map((b) => (
                  <div key={b.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                      <Star className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{b.empresa}</p>
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{b.descripcion}</p>
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
