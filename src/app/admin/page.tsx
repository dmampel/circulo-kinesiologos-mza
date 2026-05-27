import prisma from "@/lib/prisma";
import {
  Users,
  Bell,
  FileText,
  Heart,
  ShoppingBag,
  Megaphone,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    profesionalesCount,
    solicitudesPendientesCount,
    noticiasCount,
    obrasSocialesCount,
    beneficiosCount,
    circularesCount,
    capacitacionesCount,
    solicitudesRecientes,
  ] = await Promise.all([
    prisma.profesional.count({ where: { status: "ACTIVO" } }),
    prisma.solicitud.count({ where: { status: "PENDIENTE" } }),
    prisma.noticia.count(),
    prisma.obraSocial.count(),
    prisma.beneficioKineClub.count(),
    prisma.circular.count(),
    prisma.capacitacion.count(),
    prisma.solicitud.findMany({
      orderBy: { creada_en: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    {
      name: "Profesionales",
      value: profesionalesCount,
      icon: Users,
      color: "text-blue-600",
      href: "/admin/profesionales",
    },
    {
      name: "Solicitudes",
      value: solicitudesPendientesCount,
      icon: Bell,
      color: solicitudesPendientesCount > 0 ? "text-red-500" : "text-slate-400",
      href: "/admin/solicitudes",
    },
    {
      name: "Noticias",
      value: noticiasCount,
      icon: FileText,
      color: "text-violet-600",
      href: "/admin/noticias",
    },
    {
      name: "Obras Sociales",
      value: obrasSocialesCount,
      icon: Heart,
      color: "text-emerald-600",
      href: "/admin/obras-sociales",
    },
    {
      name: "KineClub",
      value: beneficiosCount,
      icon: ShoppingBag,
      color: "text-amber-600",
      href: "/admin/beneficios",
    },
    {
      name: "Circulares",
      value: circularesCount,
      icon: Megaphone,
      color: "text-indigo-600",
      href: "/admin/circulares",
    },
    {
      name: "Capacitaciones",
      value: capacitacionesCount,
      icon: BookOpen,
      color: "text-cyan-600",
      href: "/admin/capacitaciones",
    },
  ];

  const fecha = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Stats — editorial manifest layout */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-4 border-b border-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Resumen del Sistema
          </p>
          <p className="text-[10px] font-bold text-slate-300 capitalize">{fecha}</p>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-7 divide-x divide-slate-50">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="py-7 px-4 flex flex-col items-center gap-2 group hover:bg-slate-50/70 transition-all"
            >
              <stat.icon
                className={cn(
                  "h-4 w-4 transition-all opacity-40 group-hover:opacity-100",
                  stat.color
                )}
              />
              <p className={cn("text-3xl font-black tabular-nums transition-colors", stat.color)}>
                {stat.value}
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider text-center leading-tight">
                {stat.name}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Solicitudes Recientes */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-600" /> Solicitudes Recientes
            </h3>
            <Link
              href="/admin/solicitudes"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <div className="p-6">
            {solicitudesRecientes.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                <p className="text-sm font-bold text-slate-400">
                  Todo al día. No hay solicitudes pendientes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {solicitudesRecientes.map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/solicitudes/${s.id}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center font-black text-blue-600 shadow-sm text-sm">
                        {s.nombre[0]}
                        {s.apellido[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {s.nombre} {s.apellido}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {s.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase shrink-0",
                        s.status === "PENDIENTE"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      )}
                    >
                      {s.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-black mb-6">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Nueva Noticia", href: "/admin/noticias/nueva" },
                { label: "Nueva Circular", href: "/admin/circulares/nueva" },
                { label: "Nueva Capacitación", href: "/admin/capacitaciones/nuevo" },
                { label: "Agregar Beneficio KineClub", href: "/admin/beneficios/nuevo" },
                { label: "Actualizar Obras Sociales", href: "/admin/obras-sociales" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between p-5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all group"
                >
                  <span className="font-bold text-sm">{action.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                </Link>
              ))}
            </div>
          </div>
          <p className="mt-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Círculo de Kinesiólogos Mendoza · Sistema de Gestión
          </p>
        </div>
      </div>
    </div>
  );
}
