"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/30">
          <span className="text-white font-black text-2xl">CK</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-3">
          Algo salió mal
        </h1>
        <p className="text-slate-500 mb-8">
          Ocurrió un error inesperado. Podés intentarlo de nuevo o volver al inicio.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-full bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/20"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-full border border-slate-200 text-slate-600 font-black text-sm hover:border-slate-300 hover:text-slate-900 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
