"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Newspaper, Share2, Check } from "lucide-react";

export type NoticiaCard = {
  id: string;
  titulo: string;
  resumen: string | null;
  contenido: string;
  imagen_url: string | null;
  fechaCompacta: string;
  fechaLarga: string;
  slug: string;
};

const TAGS = ["Todas", "Institucional", "Convenios", "Capacitación", "Eventos"];

interface Props {
  noticias: NoticiaCard[];
  selected: NoticiaCard | null;
  selectedSlug: string | null;
  currentPage: number;
  totalPages: number;
}

export default function NoticiasReaderClient({ noticias, selected, selectedSlug, currentPage, totalPages }: Props) {
  const router = useRouter();
  const [activeTag, setActiveTag] = useState("Todas");
  const topRef = useRef<HTMLDivElement>(null);

  const others = noticias.filter((n) => n.slug !== selectedSlug).slice(0, 6);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/noticias?noticia=${selected?.slug}`;
    if (navigator.share) {
      await navigator.share({ title: selected?.titulo ?? "", url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelect = (slug: string) => {
    router.push(`/noticias?noticia=${slug}`, { scroll: false });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (selectedSlug) params.set("noticia", selectedSlug);
    params.set("pagina", String(page));
    router.push(`/noticias?${params.toString()}`, { scroll: false });
  };

  if (!noticias.length) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Newspaper className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold text-sm">No hay noticias publicadas aún.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-3">

      {/* ── FILTER NAVBAR ── */}
      <div className="flex items-center gap-2 px-1">
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTag === tag
                ? "bg-slate-400 text-white"
                : ""
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* ── 3 COLUMNAS ── */}
      <div ref={topRef} className="flex gap-4 items-start">

        {/* ── SIDEBAR ── */}
        <div className="w-72 shrink-0 sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200/60">
          <div className="overflow-y-auto">
            {noticias.map((n) => {
              const isActive = n.slug === selectedSlug;
              return (
                <button
                  key={n.id}
                  onClick={() => handleSelect(n.slug)}
                  className={`w-full text-left px-4 py-4 border-b border-slate-100 transition-colors group ${
                    isActive ? "bg-slate-900" : "hover:bg-slate-50"
                  }`}
                >
                  <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 tabular-nums ${
                    isActive ? "text-blue-400" : "text-slate-400"
                  }`}>
                    {n.fechaCompacta}
                  </p>
                  <p className={`text-sm font-bold leading-snug ${
                    isActive ? "text-white" : "text-slate-800 group-hover:text-blue-600"
                  }`}>
                    {n.titulo}
                  </p>
                  {n.resumen && (
                    <p className={`text-xs mt-1.5 leading-relaxed line-clamp-2 ${
                      isActive ? "text-slate-300" : "text-slate-400"
                    }`}>
                      {n.resumen}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="shrink-0 border-t border-slate-100 px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-xs font-bold text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="text-xs font-bold text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>

        {/* ── ARTÍCULO PRINCIPAL ── */}
        <div className="flex-1 min-w-0 ">
          {selected ? (
            <article className="max-w-2xl mx-auto px-8  py-10">
              <div className="flex items-start justify-between gap-4 mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                  {selected.fechaLarga}
                </p>
                <button
                  onClick={handleShare}
                  title="Compartir"
                  className="shrink-0 p-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                </button>
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                {selected.titulo}
              </h1>

              {selected.resumen && (
                <p className="text-xl text-slate-600 leading-relaxed mb-8 pb-8 border-b border-slate-200">
                  {selected.resumen}
                </p>
              )}

              {selected.imagen_url && (
                <figure className="mb-8">
                  <img
                    src={selected.imagen_url}
                    alt={selected.titulo}
                    className="w-full aspect-video object-cover rounded-sm"
                  />
                </figure>
              )}

              <div className="prose prose-slate prose-lg max-w-none [&>p:first-child::first-letter]:text-6xl [&>p:first-child::first-letter]:font-extrabold [&>p:first-child::first-letter]:float-left [&>p:first-child::first-letter]:mr-3 [&>p:first-child::first-letter]:leading-none [&>p:first-child::first-letter]:text-slate-900 [&>p:first-child::first-letter]:mt-1">
                <ReactMarkdown>{selected.contenido}</ReactMarkdown>
              </div>
            </article>
          ) : (
            <div className="flex items-center justify-center py-32">
              <p className="text-slate-400 text-sm">Seleccioná una nota del panel izquierdo.</p>
            </div>
          )}
        </div>

        {/* ── MINIATURAS DERECHA ── */}
        <div className="w-60 shrink-0 sticky top-4 flex flex-col gap-3">
          {others.length > 0 && (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                Más notas
              </p>
              {others.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleSelect(n.slug)}
                  className="group text-left bg-white rounded-lg overflow-hidden shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video overflow-hidden bg-slate-100">
                    {n.imagen_url ? (
                      <img
                        src={n.imagen_url}
                        alt={n.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper className="h-5 w-5 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {n.fechaCompacta}
                    </p>
                    <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {n.titulo}
                    </p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
