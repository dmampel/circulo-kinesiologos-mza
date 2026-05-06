import { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoticiaRepository } from "@/lib/repositories/NoticiaRepository";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { ChevronLeft, Share2 } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const noticia = await NoticiaRepository.getBySlug(slug);

  if (!noticia) {
    return {
      title: "Noticia no encontrada | CKM",
    };
  }

  return {
    title: `${noticia.titulo} | CKM`,
    description: noticia.resumen || noticia.titulo,
  };
}

export default async function NoticiaDetailPage({ params }: Props) {
  const { slug } = await params;
  const noticia = await NoticiaRepository.getBySlug(slug);

  if (!noticia) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <main className="max-w-4xl mx-auto px-4 md:px-8">
        
        {/* Back button */}
        <div className="mb-8">
          <Link 
            href="/noticias" 
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver a noticias
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <time 
              dateTime={noticia.publicada_en.toISOString()}
              className="text-sm font-semibold text-blue-600 tracking-wider uppercase"
            >
              {format(noticia.publicada_en, "d 'de' MMMM, yyyy", { locale: es })}
            </time>
            
            <button className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm hover:shadow transition-all">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            {noticia.titulo}
          </h1>

          {noticia.resumen && (
            <p className="text-xl text-slate-600 leading-relaxed">
              {noticia.resumen}
            </p>
          )}
        </header>

        {/* Hero Image */}
        {noticia.imagen_url && (
          <div className="mb-12 aspect-[21/9] relative rounded-2xl overflow-hidden shadow-lg border border-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={noticia.imagen_url} 
              alt={noticia.titulo}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Content - Markdown rendered with Typography */}
        <article className="prose prose-slate prose-lg md:prose-xl max-w-none bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
          <ReactMarkdown>
            {noticia.contenido}
          </ReactMarkdown>
        </article>

      </main>
    </div>
  );
}
