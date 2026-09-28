import { Clock, Home, ShieldCheck } from "lucide-react";
import Link from "next/link";

/**
 * Copy de moderación aprobado (`design.md — D6`, tasks.md — 4.9): "Vamos a
 * revisarlo y publicarlo a la brevedad" — no "ya está publicado".
 */
export default function PublicarExitoPage() {
  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center py-20 px-4">
      <div className="max-w-2xl w-full bg-white rounded-[4rem] p-12 lg:p-20 shadow-xl shadow-slate-200/50 text-center border border-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

        <div className="relative z-10">
          <div className="mx-auto h-24 w-24 bg-blue-100 rounded-[2.5rem] flex items-center justify-center text-blue-600 mb-10 shadow-lg shadow-blue-100">
            <ShieldCheck className="h-12 w-12" />
          </div>

          <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">
            ¡Aviso <span className="text-blue-600">recibido!</span>
          </h1>

          <p className="text-lg text-slate-600 mb-12 leading-relaxed">
            Vamos a revisarlo y publicarlo a la brevedad.
          </p>

          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-left mb-12">
            <Clock className="h-5 w-5 text-blue-600 mb-3" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Próximo paso</p>
            <p className="text-sm font-bold text-slate-900">
              Un administrador del Círculo revisa el aviso antes de que aparezca en el listado público.
            </p>
          </div>

          <Link
            href="/bolsa-de-trabajo"
            className="inline-flex items-center px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-lg"
          >
            <Home className="mr-2 h-5 w-5" /> Volver a la Bolsa de Trabajo
          </Link>
        </div>
      </div>
    </div>
  );
}
