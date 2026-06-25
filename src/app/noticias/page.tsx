import Image from "next/image";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { NoticiaRepository } from "@/lib/repositories/NoticiaRepository";
import { CategoriaNoticiaRepository } from "@/lib/repositories/CategoriaNoticiaRepository";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Metadata } from "next";
import { Suspense } from "react";
import SearchBar from "./SearchBar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Noticias | CKM Mendoza",
  description: "Las últimas novedades, convenios y eventos de la comunidad kinesiológica mendocina.",
};

interface Props {
  searchParams: Promise<{ pagina?: string; categoria?: string; busqueda?: string }>;
}

type NoticiaItem = {
  id: string;
  titulo: string;
  resumen: string | null;
  contenido: string;
  imagen_url: string | null;
  slug: string;
  publicada_en: Date | null;
  categoriaId: string | null;
  categoria: { id: string; nombre: string; slug: string; color: string | null } | null;
};

function fmtCorta(date: Date | null) {
  return date ? format(date, "dd MMM yyyy", { locale: es }) : "Reciente";
}

export default async function NoticiasPage({ searchParams }: Props) {
  const { pagina, categoria: categoriaSlug, busqueda } = await searchParams;
  const currentPage = Math.max(1, Number(pagina) || 1);

  const [noticiasRes, categorias, ultimasNoticias] = await Promise.all([
    NoticiaRepository.getPaginated(currentPage, 12, categoriaSlug, busqueda),
    CategoriaNoticiaRepository.getAll(),
    NoticiaRepository.getPaginated(1, 5),
  ]);

  const { items: noticias, totalPages } = noticiasRes;

  type CategoriaConCount = Awaited<ReturnType<typeof CategoriaNoticiaRepository.getAll>>[number];
  const categoriasSorted = categorias
    .sort((a: CategoriaConCount, b: CategoriaConCount) => (b._count?.noticias ?? 0) - (a._count?.noticias ?? 0))
    .map((c: CategoriaConCount) => ({ id: c.id, nombre: c.nombre, slug: c.slug }));

  const allNoticias = noticias as NoticiaItem[];

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <div className="bg-slate-900 px-8 lg:px-14 py-14 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600 rounded-full blur-[130px] opacity-25" />
          <div className="absolute -bottom-10 right-10 w-[500px] h-56 bg-indigo-700 rounded-full blur-[120px] opacity-20" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 mb-6">
            <Newspaper className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Actualidad Kinésica · CKFM Mendoza
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] mb-4">
            Noticias{" "}
            <span className="text-blue-400">del Círculo.</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-lg">
            Las últimas novedades, convenios y eventos de la comunidad kinesiológica mendocina.
          </p>
        </div>
      </div>

      {/* ── BARRA TÍTULO + BÚSQUEDA ── */}
      <div className="px-6 lg:px-14 py-4 border-b border-slate-100 flex items-end justify-end gap-4 bg-slate-50/80">
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
      </div>

      <div className="px-6 lg:px-14 py-8 space-y-10 bg-slate-50/80">

        {noticias.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <Newspaper className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-black text-lg mb-1">Sin notas en esta sección</p>
              <p className="text-slate-400 text-sm">
                {busqueda
                  ? `No hay resultados para "${busqueda}".`
                  : categoriaSlug
                    ? "No hay noticias publicadas bajo esta categoría."
                    : "No hay noticias publicadas aún."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-8 items-start">

            {/* ── CONTENIDO PRINCIPAL ── */}
            <div className="flex-1 min-w-0 space-y-6">
              <p className="text-lg tracking-tight leading-[1.05] capitalize text-slate-300 font-semibold">
                {format(new Date(), "MMMM yyyy", { locale: es })}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {allNoticias.map((n: NoticiaItem) => (
                  <Link
                    key={n.id}
                    href={`/noticias/${n.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      {n.imagen_url ? (
                        <Image
                          src={n.imagen_url}
                          alt={n.titulo}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                          {fmtCorta(n.publicada_en)}
                        </span>
                        {n.categoria && (
                          <>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                              {n.categoria.nombre}
                            </span>
                          </>
                        )}
                      </div>
                      <h2 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                        {n.titulo}
                      </h2>
                      {n.resumen && (
                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                          {n.resumen}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  {currentPage > 1 && (
                    <Link
                      href={`/noticias?pagina=${currentPage - 1}${categoriaSlug ? `&categoria=${categoriaSlug}` : ""}${busqueda ? `&busqueda=${busqueda}` : ""}`}
                      className="px-5 py-2 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
                    >
                      ← Anterior
                    </Link>
                  )}
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    {currentPage} / {totalPages}
                  </span>
                  {currentPage < totalPages && (
                    <Link
                      href={`/noticias?pagina=${currentPage + 1}${categoriaSlug ? `&categoria=${categoriaSlug}` : ""}${busqueda ? `&busqueda=${busqueda}` : ""}`}
                      className="px-5 py-2 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
                    >
                      Siguiente →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <aside className="w-64 shrink-0 sticky top-6 flex flex-col gap-6">

              {/* Categorías con conteo */}
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Categorías</p>
                </div>
                <div className="divide-y divide-slate-50">
                  <Link
                    href="/noticias"
                    className={`flex items-center justify-between px-4 py-2.5 transition-colors group ${!categoriaSlug ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  >
                    <span className={`text-xs font-bold uppercase tracking-wide ${!categoriaSlug ? "text-blue-600" : "text-slate-600 group-hover:text-slate-900"}`}>
                      Ver todas
                    </span>
                  </Link>
                  {categoriasSorted.map((cat: { id: string; nombre: string; slug: string }) => {
                    const count = categorias.find((c: CategoriaConCount) => c.id === cat.id)?._count?.noticias ?? 0;
                    const isActive = categoriaSlug === cat.slug;
                    return (
                      <Link
                        key={cat.id}
                        href={`/noticias?categoria=${cat.slug}`}
                        className={`flex items-center justify-between px-4 py-2.5 transition-colors group ${isActive ? "bg-blue-50" : "hover:bg-slate-50"}`}
                      >
                        <span className={`text-xs font-medium uppercase tracking-wide ${isActive ? "text-blue-600" : "text-slate-600 group-hover:text-slate-900"}`}>
                          {cat.nombre}
                        </span>
                        <span className={`text-[10px] font-black tabular-nums ${isActive ? "text-blue-400" : "text-slate-300"}`}>
                          {count}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Últimas noticias */}
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Últimas noticias</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {(ultimasNoticias.items as NoticiaItem[]).map((n) => (
                    <Link
                      key={n.id}
                      href={`/noticias/${n.slug}`}
                      className="flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="relative w-14 h-12 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                        {n.imagen_url ? (
                          <Image src={n.imagen_url} alt={n.titulo} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Newspaper className="h-3.5 w-3.5 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                          {n.titulo}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                          {fmtCorta(n.publicada_en)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

            </aside>
          </div>
        )}

      </div>
    </div>
  );
}
