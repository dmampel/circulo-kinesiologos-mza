import { createClient } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { redirect } from "next/navigation";
import CarnetDigital from "@/components/socio/CarnetDigital";
import { ChevronLeft, Info } from "lucide-react";
import Link from "next/link";

export default async function CarnetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profesional = await ProfesionalRepository.findByUserId(user.id);

  if (!profesional) {
    redirect("/mi-panel");
  }

  return (
    <div className="flex flex-col gap-10 max-w-2xl mx-auto py-10">
      <div className="flex items-center justify-between">
        <Link 
          href="/mi-panel"
          className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all group"
        >
          <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Volver al panel
        </Link>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Credencial Digital</p>
      </div>

      <div className="space-y-6">
        <div className="text-center space-y-2 mb-12">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Tu Credencial</h1>
          <p className="text-sm text-slate-500 font-medium">Mostrá esta pantalla para acreditar tu identidad profesional.</p>
        </div>

        <div className="px-4">
          <CarnetDigital profesional={profesional} />
        </div>

        <div className="mt-12 p-8 rounded-[2.5rem] bg-blue-50 border border-blue-100 flex gap-6 items-start">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <Info className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-blue-900 uppercase text-xs tracking-wider">Uso de la credencial</h4>
            <p className="text-xs font-bold text-blue-800/60 leading-relaxed">
              Esta credencial digital es válida para acreditar tu condición de socio activo del Círculo de Kinesiólogos de Mendoza ante entidades y pacientes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
