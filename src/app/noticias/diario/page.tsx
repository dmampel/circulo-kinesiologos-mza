import { ChevronRight, Newspaper, X } from "lucide-react";
import Link from "next/link";
import { NoticiaRepository } from "@/lib/repositories/NoticiaRepository";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function DiarioPage() {
  const noticias = await NoticiaRepository.getLatest();
  const hoy = format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const edicion = 412;

  return (
    <div className="paper-texture bg-[#f5f0e8] min-h-screen">
      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[997]" style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(80,60,30,0.09) 100%)" }} />

      {/* Cerrar */}
      <Link
        href="/noticias"
        className="fixed top-5 right-5 z-[1000] flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
      >
        <X className="h-3 w-3" /> Cerrar
      </Link>

      <div className="max-w-screen-lg mx-auto px-6 sm:px-10 lg:px-16">

        {/* ── MASTHEAD ── */}
        <header className="pt-10 pb-0">
          <div className="border-t-[3px] border-slate-900 pt-2 pb-1.5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
            <span>Círculo de Kinesiólogos de Mendoza</span>
            <span>{hoy}</span>
            <span>ckm.mendoza.ar</span>
          </div>

          <div className="flex items-end justify-between border-b-[3px] border-slate-900 pb-3 mb-2">
            <div className="leading-none">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-none">
                Diario
              </div>
              <div className="text-5xl sm:text-6xl lg:text-7xl font-black italic text-blue-700 tracking-tighter leading-none -mt-1">
                del Círculo
              </div>
            </div>
            <div className="text-right pb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Edición digital</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">N°{edicion}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-400 pb-1.5 mb-0">
            <span>Kinesiología · Salud · Comunidad</span>
            <span className="text-blue-700 font-black">· Edición Gratuita ·</span>
            <span>Todos los derechos reservados</span>
          </div>
        </header>

        {/* ── NOTA PRINCIPAL (01) ── */}
        {noticias[0] && (
          <section className="border-b-2 border-slate-900 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

              {/* Columna izquierda: número + titular + cuerpo */}
              <div className="lg:col-span-7 lg:pr-8 lg:border-r lg:border-slate-400">
                <span className="text-7xl font-black text-blue-700 leading-none block mb-3">01</span>

                <Link href={`/noticias?noticia=${noticias[0].slug}`} className="group block mb-5">
                  <h2 className="text-3xl lg:text-4xl font-black italic text-slate-900 leading-[1.1] tracking-tight group-hover:text-blue-700 transition-colors">
                    {noticias[0].titulo}
                  </h2>
                </Link>

                {/* Cuerpo en dos columnas estilo diario */}
                {noticias[0].resumen && (
                  <div className="columns-2 gap-6 text-sm text-slate-700 leading-relaxed text-justify">
                    <p className="first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:leading-none first-letter:text-slate-900 first-letter:mt-1">
                      {noticias[0].resumen}
                    </p>
                    <p className="mt-3 text-slate-500">
                      El Círculo de Kinesiólogos de Mendoza continúa trabajando para brindar a sus socios las herramientas necesarias para el ejercicio profesional de excelencia en toda la provincia.
                    </p>
                  </div>
                )}

                {noticias[0].publicada_en && (
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-5 border-t border-slate-300 pt-3">
                    Publicado el {format(noticias[0].publicada_en, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                )}
              </div>

              {/* Columna derecha: imagen */}
              <div className="lg:col-span-5 lg:pl-8 mt-6 lg:mt-0 flex flex-col">
                <div className="flex-1">
                  {noticias[0].imagen_url ? (
                    <figure>
                      <img
                        src={noticias[0].imagen_url}
                        alt={noticias[0].titulo}
                        className="w-full aspect-[4/3] object-cover grayscale-[15%] contrast-[1.05]"
                      />
                      <figcaption className="text-[9px] italic text-slate-400 mt-1">
                        Foto: Círculo de Kinesiólogos de Mendoza
                      </figcaption>
                    </figure>
                  ) : (
                    <div className="w-full aspect-[4/3] bg-slate-300 flex items-center justify-center">
                      <Newspaper className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                </div>

                <Link
                  href={`/noticias?noticia=${noticias[0].slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:gap-2 transition-all"
                >
                  Leer nota completa <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── PULL QUOTE ── */}
        {noticias[1] && (
          <section className="py-8 border-b border-slate-400">
            <div className="flex items-start gap-4 max-w-2xl mx-auto text-center justify-center">
              <div>
                <span className="text-blue-700 text-5xl font-black leading-none block">&ldquo;</span>
                <p className="text-3xl lg:text-4xl font-black italic text-slate-700 leading-tight">
                  {noticias[1].resumen?.slice(0, 120) ?? noticias[1].titulo}
                </p>
                <span className="text-blue-700 text-5xl font-black leading-none block">&rdquo;</span>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-4">
                  — {noticias[1].publicada_en ? format(noticias[1].publicada_en, "MMMM yyyy", { locale: es }) : "CKM Mendoza"}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── NOTAS SECUNDARIAS (02 03 04) ── */}
        {noticias.length > 2 && (
          <section className="border-b-2 border-slate-900 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-400">
              {noticias.slice(2, 5).map((n, i) => (
                <Link
                  key={n.id}
                  href={`/noticias?noticia=${n.slug}`}
                  className="group flex flex-col gap-3 px-6 first:pl-0 last:pr-0 py-4 sm:py-0"
                >
                  <span className="text-4xl font-black text-blue-700 leading-none">
                    {String(i + 2).padStart(2, "0")}
                  </span>
                  {n.imagen_url && (
                    <img src={n.imagen_url} alt={n.titulo} className="w-full aspect-video object-cover grayscale-[20%]" />
                  )}
                  <h3 className="font-black italic text-slate-900 text-base leading-tight group-hover:text-blue-700 transition-colors">
                    {n.titulo}
                  </h3>
                  {n.resumen && (
                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 text-justify">
                      {n.resumen}
                    </p>
                  )}
                  {n.publicada_en && (
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-auto border-t border-slate-300 pt-2">
                      {format(n.publicada_en, "dd MMM yyyy", { locale: es })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── MÁS NOTAS ── */}
        {noticias.length > 5 && (
          <section className="py-8">
            <div className="flex items-center gap-4 mb-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 shrink-0">Más notas</p>
              <div className="h-px flex-1 bg-slate-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {noticias.slice(5).map((n) => (
                <Link
                  key={n.id}
                  href={`/noticias?noticia=${n.slug}`}
                  className="group flex items-baseline gap-4 py-3 border-b border-slate-300 last:border-0 pr-6"
                >
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest shrink-0 w-12 tabular-nums">
                    {n.publicada_en ? format(n.publicada_en, "dd MMM", { locale: es }) : "—"}
                  </span>
                  <h4 className="font-black italic text-slate-800 text-sm leading-snug group-hover:text-blue-700 transition-colors">
                    {n.titulo}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── PIE ── */}
        <footer className="border-t-2 border-slate-900 py-6 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            El Diario del Círculo · CKM Mendoza · N°{edicion}
          </p>
          <Link
            href="/noticias"
            className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X className="h-3 w-3" /> Cerrar edición
          </Link>
        </footer>

      </div>
    </div>
  );
}
