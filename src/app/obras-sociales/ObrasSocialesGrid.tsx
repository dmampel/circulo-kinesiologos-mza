"use client";

import { useState } from "react";
import { Search, ShieldCheck, FileText } from "lucide-react";

interface ObraSocial {
  id: string;
  nombre: string;
  logo_url: string | null;
  convenio_url: string | null;
}

export default function ObrasSocialesGrid({ obrasSociales }: { obrasSociales: ObraSocial[] }) {
  const [query, setQuery] = useState("");

  const filtered = obrasSociales.filter((os) =>
    os.nombre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* Buscador */}
      <div className="relative max-w-xl mx-auto mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar obra social o prepaga..."
          className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white/20 transition-all text-sm font-medium backdrop-blur-md"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-500 font-bold">
            {query ? `Sin resultados para "${query}"` : "Aún no hay obras sociales cargadas en el sistema."}
          </div>
        ) : (
          filtered.map((os) => (
            <div
              key={os.id}
              className="bg-white/60 backdrop-blur-2xl p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
            >
              <div className="h-24 w-full rounded-2xl bg-slate-50 flex items-center justify-center mb-6 overflow-hidden border border-slate-100 p-4">
                {os.logo_url ? (
                  <img
                    src={os.logo_url}
                    alt={os.nombre}
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <ShieldCheck className="h-10 w-10 text-slate-300" />
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex-grow">
                {os.nombre}
              </h3>
              <div className="flex items-center text-[10px] font-black text-green-600 uppercase tracking-wider mb-6 mt-auto">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                Convenio Activo
              </div>

              <div className="flex items-center space-x-2 mt-auto">
                {os.convenio_url ? (
                  <a
                    href={os.convenio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center py-2.5 rounded-xl bg-slate-50 text-slate-900 text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Vademécum
                  </a>
                ) : (
                  <span className="flex-1 inline-flex items-center justify-center py-2.5 rounded-xl bg-slate-50 text-slate-400 text-xs font-bold">
                    Sin PDF adjunto
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
