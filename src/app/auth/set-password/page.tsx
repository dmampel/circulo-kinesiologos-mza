import { updatePassword } from "@/app/auth/actions";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 text-slate-900">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <span className="font-black text-xl">CK</span>
            </div>
            <div className="text-left">
              <span className="block font-black text-xl tracking-tighter uppercase leading-none">Activar Cuenta</span>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Portal de Socios</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-50">
          <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Elegí tu contraseña</h1>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            Tu solicitud ha sido aprobada. Ahora definí una contraseña segura para acceder a tu panel.
          </p>

          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1 flex items-center">
                <Lock className="mr-2 h-3 w-3" /> Nueva Contraseña
              </label>
              <input 
                id="password"
                name="password"
                type="password" 
                required
                minLength={6}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium" 
                placeholder="Mínimo 6 caracteres" 
              />
            </div>

            <button 
              formAction={updatePassword}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center group"
            >
              Activar mi cuenta <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <p className="text-center mt-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center">
          <ShieldCheck className="h-3 w-3 mr-2 text-green-500" /> Tu seguridad es nuestra prioridad
        </p>
      </div>
    </div>
  );
}
