import { login } from "@/app/auth/actions";
import { ShieldCheck, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center space-x-2 text-slate-900 group">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <span className="font-black text-xl">CK</span>
            </div>
            <div className="text-left">
              <span className="block font-black text-xl tracking-tighter">Círculo Kinesiología</span>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Panel de Acceso</span>
            </div>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-50">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Bienvenido</h1>
          <p className="text-sm text-slate-500 mb-6">Ingresá tus credenciales para acceder al panel.</p>

          {searchParams.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
              <ShieldCheck className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-600 leading-relaxed">
                {searchParams.error === "Could not authenticate user" 
                  ? "Credenciales incorrectas. Por favor verificá tu email y contraseña." 
                  : searchParams.error}
              </p>
            </div>
          )}

          {searchParams.message && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-blue-600 leading-relaxed">
                {searchParams.message}
              </p>
            </div>
          )}

          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1 flex items-center">
                <Mail className="mr-2 h-3 w-3" /> Correo Electrónico
              </label>
              <input 
                id="email"
                name="email"
                type="email" 
                required
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium" 
                placeholder="ejemplo@mail.com" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-black text-slate-400 uppercase flex items-center">
                  <Lock className="mr-2 h-3 w-3" /> Contraseña
                </label>
                <Link href="#" className="text-[10px] font-bold text-blue-600 hover:underline">¿Olvidaste tu contraseña?</Link>
              </div>
              <input 
                id="password"
                name="password"
                type="password" 
                required
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium" 
                placeholder="••••••••" 
              />
            </div>

            <button 
              formAction={login}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center group"
            >
              Ingresar <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center mt-10 text-xs text-slate-400 font-medium leading-relaxed">
          ¿No sos socio todavía? <Link href="/registro" className="text-blue-600 font-bold hover:underline">Solicitá tu asociación aquí</Link>
          <br />
          <span className="inline-flex items-center mt-4">
            <ShieldCheck className="h-3 w-3 mr-1" /> Conexión segura y encriptada
          </span>
        </p>
      </div>
    </div>
  );
}
