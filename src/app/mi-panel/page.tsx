import { createClient } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { redirect } from "next/navigation";
import CarnetDigital from "@/components/socio/CarnetDigital";
import { 
  ArrowUpRight, 
  UserCircle, 
  Bell, 
  Settings,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profesional = await ProfesionalRepository.findByUserId(user.id);

  if (!profesional) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Usuario no vinculado</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Tu usuario de acceso no está vinculado a un perfil profesional en nuestro padrón. 
          Por favor, contactá a soporte técnico.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header / Welcome */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
            Bienvenido al Panel
          </p>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            Hola, <span className="text-blue-600">{profesional.nombre}</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
            <Bell className="h-5 w-5" />
          </button>
          <button className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Stats / Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Estado de Matrícula
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-900 leading-none">M.P. {profesional.matricula}</p>
                  <p className="text-green-600 font-bold text-xs mt-2 flex items-center uppercase">
                    <CheckCircle2 className="h-3 w-3 mr-1.5" /> Habilitado
                  </p>
                </div>
                <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Localidad Registrada
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-900 leading-none">{profesional.localidad.nombre}</p>
                  <p className="text-slate-400 font-bold text-xs mt-2 uppercase">Mendoza, AR</p>
                </div>
                <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Activity / Notifications Mockup */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Novedades del Círculo</h3>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-6 items-start pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="h-12 w-12 bg-blue-50 rounded-2xl shrink-0 flex items-center justify-center text-blue-600">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Nueva actualización de convenios con Obras Sociales</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Se han actualizado los valores de las prestaciones para el mes de Mayo. Por favor revisá el listado oficial.
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Hace 2 horas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[3rem] p-8 text-center relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-8">Credencial Profesional</p>
              <div className="scale-[0.8] origin-center -my-10">
                <CarnetDigital profesional={profesional} />
              </div>
              <Link 
                href="/mi-panel/carnet"
                className="inline-flex items-center justify-center w-full mt-10 p-5 rounded-2xl bg-white text-slate-900 font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all group/btn shadow-xl shadow-white/5"
              >
                Ver en Pantalla Completa
                <ArrowUpRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </Link>
            </div>
            
            {/* Background Glow */}
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-20" />
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-tight">Accesos Rápidos</h4>
            <div className="space-y-3">
              <Link href="/mi-panel/perfil" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold text-sm">
                <UserCircle className="h-5 w-5" /> Editar mis datos públicos
              </Link>
              <Link href="/obras-sociales" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold text-sm">
                <ArrowUpRight className="h-5 w-5" /> Ver Listado de Obras Sociales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
