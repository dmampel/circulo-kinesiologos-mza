import { requestPasswordReset } from "@/app/auth/actions";
import { ShieldCheck, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sent = params.message === "sent";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <Link href="/login" className="inline-flex items-center space-x-2 text-slate-900 group">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <span className="font-black text-xl">CK</span>
            </div>
            <div className="text-left">
              <span className="block font-black text-xl tracking-tighter">Círculo Kinesiología</span>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recuperar acceso</span>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-50">
          {sent ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-3">¡Revisá tu email!</h1>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Si el email existe en nuestro sistema, recibirás un correo con instrucciones para restablecer tu contraseña.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center text-sm font-bold text-blue-600 hover:underline"
              >
                Volver al inicio de sesión <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black text-slate-900 mb-2">¿Olvidaste tu contraseña?</h1>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
              </p>

              {params.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                  <ShieldCheck className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-red-600 leading-relaxed">{params.error}</p>
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

                <button
                  formAction={requestPasswordReset}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center group"
                >
                  Recuperar Contraseña
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                  ← Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-10 text-xs text-slate-400 font-medium flex items-center justify-center">
          <ShieldCheck className="h-3 w-3 mr-1" /> Conexión segura y encriptada
        </p>
      </div>
    </div>
  );
}
