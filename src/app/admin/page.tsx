import prisma from "@/lib/prisma";
import { 
  Users, 
  Bell, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  // 1. Fetch de estadísticas y solicitudes recientes
  const [profesionalesCount, solicitudesCount, noticiasCount, solicitudesRecientes] = await Promise.all([
    prisma.profesional.count({ where: { status: "ACTIVO" } }),
    prisma.solicitud.count({ where: { status: "PENDIENTE" } }),
    prisma.noticia.count(),
    prisma.solicitud.findMany({
      orderBy: { creada_en: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { name: "Profesionales Activos", value: profesionalesCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Solicitudes Pendientes", value: solicitudesCount, icon: Bell, color: "text-red-600", bg: "bg-red-50" },
    { name: "Noticias Publicadas", value: noticiasCount, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.name}</p>
              <h3 className="text-4xl font-black text-slate-900">{stat.value}</h3>
            </div>
            <div className={cn("h-16 w-16 rounded-3xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("h-8 w-8", stat.color)} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity / Solicitudes */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-600" /> Solicitudes Recientes
            </h3>
            <Link href="/admin/solicitudes" className="text-xs font-bold text-blue-600 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="p-6">
            {solicitudesRecientes.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                <p className="text-sm font-bold text-slate-400">Todo al día. No hay solicitudes pendientes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {solicitudesRecientes.map((solicitud) => (
                  <div key={solicitud.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center font-black text-blue-600 shadow-sm">
                        {solicitud.nombre[0]}{solicitud.apellido[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{solicitud.nombre} {solicitud.apellido}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Matrícula: {solicitud.matricula}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                      solicitud.status === "PENDIENTE" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                    )}>
                      {solicitud.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-black mb-6">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 gap-4">
              <Link href="/admin/noticias/nueva" className="flex items-center justify-between p-6 rounded-2xl bg-white/10 hover:bg-white/20 transition-all group">
                <span className="font-bold">Nueva Noticia</span>
                <ArrowUpRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
              </Link>
              <Link href="/admin/beneficios" className="flex items-center justify-between p-6 rounded-2xl bg-white/10 hover:bg-white/20 transition-all group">
                <span className="font-bold">Agregar Beneficio KineClub</span>
                <ArrowUpRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
              </Link>
              <Link href="/admin/obras-sociales" className="flex items-center justify-between p-6 rounded-2xl bg-white/10 hover:bg-white/20 transition-all group">
                <span className="font-bold">Actualizar Obras Sociales</span>
                <ArrowUpRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
              </Link>
            </div>
          </div>
          <p className="mt-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Círculo de Kinesiólogos Mendoza • Sistema de Gestión</p>
        </div>
      </div>
    </div>
  );
}

// Necesitamos importar 'cn' para que funcione el estilo de las stats
import { cn } from "@/lib/utils";
