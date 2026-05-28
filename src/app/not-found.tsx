import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/30">
          <span className="text-white font-black text-2xl">CKFM</span>
        </div>
        <p className="text-blue-600 text-xs font-black uppercase tracking-widest mb-3">
          Error 404
        </p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-3">
          Página no encontrada
        </h1>
        <p className="text-slate-500 mb-8">
          La página que buscás no existe o fue movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-full bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/20"
          >
            Ir al inicio
          </Link>
          <Link
            href="/profesionales"
            className="px-6 py-3 rounded-full border border-slate-200 text-slate-600 font-black text-sm hover:border-slate-300 hover:text-slate-900 transition-colors"
          >
            Buscar profesionales
          </Link>
        </div>
      </div>
    </div>
  );
}
