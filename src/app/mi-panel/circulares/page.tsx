import { createClient } from "@/utils/supabase/server";
import { CircularRepository } from "@/lib/repositories/CircularRepository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, FileText, Megaphone } from "lucide-react";

export default async function CircularesHistorialPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const circulares = await CircularRepository.getAllPublished();

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
          Panel Profesional · CKM
        </p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
          Circulares Institucionales
        </h1>
        <p className="text-sm text-slate-500 font-medium pt-1">
          {circulares.length > 0
            ? `${circulares.length} ${circulares.length === 1 ? "circular publicada" : "circulares publicadas"}`
            : "Comunicaciones internas del Círculo."}
        </p>
      </div>

      {/* List */}
      {circulares.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
            <Megaphone className="h-8 w-8" />
          </div>
          <p className="text-slate-500 font-medium">
            No hay circulares publicadas por el momento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {circulares.map((circular) => {
            const fecha = circular.publicada_en || circular.createdAt;
            const dia = new Date(fecha)
              .getDate()
              .toString()
              .padStart(2, "0");
            const mes = new Intl.DateTimeFormat("es-AR", {
              month: "short",
            }).format(fecha);
            const anio = new Date(fecha).getFullYear();
            const preview = circular.contenido?.trim();

            return (
              <Link
                key={circular.id}
                href={`/mi-panel/circulares/${circular.id}`}
                className="group flex gap-5 bg-white border border-slate-100 rounded-2xl p-6 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50/60 transition-all duration-200"
              >
                {/* Bloque de fecha */}
                <div className="shrink-0 flex flex-col items-center justify-start pt-0.5 w-10 text-center">
                  <span className="text-2xl font-black text-slate-900 leading-none tabular-nums">
                    {dia}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-none">
                    {mes}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 tracking-wide leading-none mt-0.5">
                    {anio}
                  </span>
                </div>

                {/* Divisor vertical */}
                <div className="w-px bg-slate-100 group-hover:bg-blue-200 transition-colors self-stretch shrink-0" />

                {/* Contenido */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 group-hover:bg-blue-100 transition-colors">
                      {circular.etiqueta}
                    </span>
                    {circular.archivo_url && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <FileText className="h-3 w-3" />
                        Adjunto
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                    {circular.titulo}
                  </h3>
                  {preview && (
                    <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {preview}
                    </p>
                  )}
                </div>

                {/* Flecha */}
                <div className="shrink-0 flex items-center self-center">
                  <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
