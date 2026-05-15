import { Newspaper } from "lucide-react";
import { NoticiaRepository } from "@/lib/repositories/NoticiaRepository";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Metadata } from "next";
import NoticiasReaderClient from "./NoticiasReaderClient";

interface Props {
  searchParams: Promise<{ noticia?: string; pagina?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { noticia: slug } = await searchParams;
  if (!slug) return { title: "Noticias | CKM Mendoza" };

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

export default async function NoticiasPage({ searchParams }: Props) {
  const { noticia: slug, pagina } = await searchParams;
  const currentPage = Math.max(1, Number(pagina) || 1);
  const { items: noticias, totalPages } = await NoticiaRepository.getPaginated(currentPage);

  const serialize = (n: (typeof noticias)[0]) => ({
    id: n.id,
    titulo: n.titulo,
    resumen: n.resumen,
    contenido: n.contenido,
    imagen_url: n.imagen_url,
    slug: n.slug,
    fechaCompacta: n.publicada_en
      ? format(n.publicada_en, "dd MMM yyyy", { locale: es })
      : "Reciente",
    fechaLarga: n.publicada_en
      ? format(n.publicada_en, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
      : "",
  });

  const noticiasSerialized = noticias.map(serialize);
  const selectedRaw = slug
    ? (noticias.find((n) => n.slug === slug) ?? noticias[0])
    : noticias[0];
  const selected = selectedRaw ? serialize(selectedRaw) : null;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ── HERO ── */}
      <div className="bg-slate-900 px-8 lg:px-14 py-14 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600 rounded-full blur-[130px] opacity-25" />
          <div className="absolute -bottom-10 right-10 w-[500px] h-56 bg-indigo-700 rounded-full blur-[120px] opacity-20" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-sky-500 rounded-full blur-[150px] opacity-10" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 mb-6">
            <Newspaper className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Actualidad Kinésica · CKM Mendoza
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] mb-4">
            Noticias{" "}
            <span className="text-blue-400 italic">del Círculo</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-lg">
            Las últimas novedades, convenios y eventos de la comunidad kinesiológica mendocina.
          </p>
        </div>

        <div className="relative z-10 mt-8 flex items-center gap-3">
          <div className="h-px w-8 bg-blue-500/50" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {noticias.length} {noticias.length === 1 ? "nota publicada" : "notas publicadas"}
          </p>
        </div>
      </div>

      <NoticiasReaderClient
        noticias={noticiasSerialized}
        selected={selected}
        selectedSlug={selected?.slug ?? null}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
