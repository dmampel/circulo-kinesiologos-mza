import { Calendar, Clock, ChevronRight, Share2, Tag } from "lucide-react";
import Link from "next/link";
import { NoticiaRepository } from "@/lib/repositories/NoticiaRepository";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function NoticiasPage() {
  const noticias = await NoticiaRepository.getLatest();

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header Noticias */}
      <div className="bg-white border-b pt-20 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-black text-slate-900 mb-6 leading-tight">
              Actualidad <span className="text-blue-600">Kinésica</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Mantenete informado sobre las últimas novedades del Círculo, convenios, capacitaciones y eventos de nuestra comunidad.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Columna de Noticias (Grid) */}
          <div className="lg:col-span-2 space-y-10">
            {noticias.map((n) => (
              <article key={n.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                  <div className="md:col-span-2 bg-slate-100 min-h-[200px] flex items-center justify-center text-slate-300">
                    {n.imagen_url ? (
                      <img src={n.imagen_url} alt={n.titulo} className="h-full w-full object-cover" />
                    ) : (
                      <Calendar className="h-12 w-12 opacity-20" />
                    )}
                  </div>
                  <div className="md:col-span-3 p-8 lg:p-10 flex flex-col justify-center">
                    <div className="flex items-center space-x-4 mb-4 text-[10px] font-black uppercase tracking-widest text-blue-600">
                      <span className="bg-blue-50 px-3 py-1 rounded-full">General</span>
                      <span className="text-slate-400 flex items-center">
                        <Clock className="mr-1 h-3 w-3" /> 
                        {n.publicada_en ? format(n.publicada_en, "dd 'de' MMMM", { locale: es }) : "Reciente"}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                      {n.titulo}
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">
                      {n.resumen}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                      <Link href={`/noticias/${n.slug}`} className="text-sm font-black text-slate-900 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center">
                        Leer nota completa <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                      <button className="text-slate-400 hover:text-blue-600 transition-colors">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Sidebar / Categorías */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center">
                <Tag className="mr-2 h-4 w-4 text-blue-600" /> Categorías
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Institucional", "Convenios", "Capacitación", "Eventos", "Varios"].map((cat) => (
                  <button key={cat} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all">
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
              <h3 className="text-xl font-black mb-4">¿Tenés una novedad?</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Si sos socio y querés difundir algún evento o curso, contactate con el área de comunicación.
              </p>
              <Link href="/contacto" className="inline-block px-6 py-3 bg-white text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest">
                Contactar ahora
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
