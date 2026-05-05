import { CheckCircle2, Home, Mail, Clock } from "lucide-react";
import Link from "next/link";

export default function RegistroExitoPage() {
  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center py-20 px-4">
      <div className="max-w-2xl w-full bg-white rounded-[4rem] p-12 lg:p-20 shadow-xl shadow-slate-200/50 text-center border border-slate-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        
        <div className="relative z-10">
          <div className="mx-auto h-24 w-24 bg-green-100 rounded-[2.5rem] flex items-center justify-center text-green-600 mb-10 shadow-lg shadow-green-100 animate-bounce">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">
            ¡Solicitud <span className="text-green-600">Recibida!</span>
          </h1>
          
          <p className="text-lg text-slate-600 mb-12 leading-relaxed">
            Tu trámite de asociación ha sido iniciado correctamente. Nuestro equipo revisará la documentación y te contactaremos por email en un plazo de 48 a 72 horas hábiles.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <Mail className="h-5 w-5 text-blue-600 mb-3" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Revisá tu mail</p>
              <p className="text-sm font-bold text-slate-900">Te enviamos un comprobante de la solicitud.</p>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <Clock className="h-5 w-5 text-orange-500 mb-3" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Próximos pasos</p>
              <p className="text-sm font-bold text-slate-900">Aprobación de matrícula y alta de usuario.</p>
            </div>
          </div>

          <Link 
            href="/" 
            className="inline-flex items-center px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-lg"
          >
            <Home className="mr-2 h-5 w-5" /> Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
