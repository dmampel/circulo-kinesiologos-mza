import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Newspaper } from "lucide-react";
import { NoticiaRepository } from "@/lib/repositories/NoticiaRepository";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import ShareButton from "./ShareButton";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const noticia = await NoticiaRepository.getBySlug(slug);
  if (!noticia) return { title: "Noticias | CKM Mendoza" };

  return {
    title: `${noticia.titulo} | CKM Mendoza`,
    description: noticia.resumen ?? noticia.titulo,
    openGraph: {
      title: noticia.titulo,
      description: noticia.resumen ?? noticia.titulo,
      images: noticia.imagen_url ? [noticia.imagen_url] : [],
    },
  };
}

export default async function NoticiaDetallePage({ params }: Props) {
  const { slug } = await params;
  const noticia = await NoticiaRepository.getBySlug(slug);

  if (!noticia) notFound();

  const relacionadas = await NoticiaRepository.getRelated(noticia.id, noticia.categoriaId, 6);

  const fecha = noticia.publicada_en
    ? format(noticia.publicada_en, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    : null;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── VOLVER ── */}
        <Link
          href="/noticias"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver a noticias
        </Link>

        <div className="flex gap-10 items-start">

          {/* ── ARTÍCULO PRINCIPAL ── */}
          <article className="flex-1 min-w-0 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/60">

            {/* Imagen hero */}
            {noticia.imagen_url ? (
              <div className="aspect-video overflow-hidden bg-slate-100">
                <img
                  src={noticia.imagen_url}
                  alt={noticia.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-slate-100 flex items-center justify-center">
                <Newspaper className="h-12 w-12 text-slate-300" />
              </div>
            )}

            <div className="px-8 py-8">
              {/* Metadata */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {noticia.categoria && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 px-2.5 py-1 rounded-full">
                      {noticia.categoria.nombre}
                    </span>
                  )}
                  {fecha && (
                    <span className="text-xs font-semibold text-slate-400">
                      {fecha}
                    </span>
                  )}
                </div>
                <ShareButton titulo={noticia.titulo} slug={noticia.slug} />
              </div>

              {/* Título */}
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-5">
                {noticia.titulo}
              </h1>

              {/* Resumen */}
              {noticia.resumen && (
                <p className="text-lg text-slate-500 leading-relaxed mb-8 pb-8 border-b border-slate-100">
                  {noticia.resumen}
                </p>
              )}

              {/* Contenido */}
              <div className="prose prose-slate prose-base max-w-none [&>p:first-child::first-letter]:text-5xl [&>p:first-child::first-letter]:font-extrabold [&>p:first-child::first-letter]:float-left [&>p:first-child::first-letter]:mr-3 [&>p:first-child::first-letter]:leading-none [&>p:first-child::first-letter]:text-slate-900 [&>p:first-child::first-letter]:mt-1">
                <ReactMarkdown>{noticia.contenido}</ReactMarkdown>
              </div>

              {/* Footer del artículo */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <Newspaper className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">CKM Mendoza</p>
                  <p className="text-[10px] text-slate-300">Círculo de Kinesiólogos de Mendoza</p>
                </div>
              </div>
            </div>
          </article>

          {/* ── SIDEBAR RELACIONADAS ── */}
          <aside className="w-72 shrink-0 sticky top-6 flex flex-col gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              {noticia.categoria ? `Más de ${noticia.categoria.nombre}` : "Más noticias"}
            </p>

            {relacionadas.length === 0 ? (
              <p className="text-xs text-slate-400 px-1">No hay más noticias en esta categoría.</p>
            ) : (
              relacionadas.map((n) => {
                const fechaCard = n.publicada_en
                  ? format(n.publicada_en, "dd MMM yyyy", { locale: es })
                  : "Reciente";
                return (
                  <Link
                    key={n.id}
                    href={`/noticias/${n.slug}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
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
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                          {fechaCard}
                        </span>
                        {n.categoria && (
                          <>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                              {n.categoria.nombre}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                        {n.titulo}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </aside>

        </div>
      </div>
    </div>
  );
}
