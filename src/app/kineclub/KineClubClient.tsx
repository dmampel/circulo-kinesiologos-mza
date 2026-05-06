"use client";

import { 
  Ticket, 
  ShoppingBag, 
  ChevronRight, 
  Sparkles, 
  Plane, 
  Coffee as Utensils, 
  Heart, 
  Tag, 
  GraduationCap 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ICON_MAP: Record<string, any> = {
  Sparkles,
  Plane,
  Utensils,
  ShoppingBag,
  Heart,
  Tag,
  GraduationCap
};

interface Beneficio {
  id: string;
  empresa: string;
  descripcion: string;
  descuento: string | null;
  categoria: {
    nombre: string;
    slug: string;
  };
  logo_url?: string | null;
  url?: string | null;
}

interface Props {
  beneficios: Beneficio[];
  currentCat: string;
  categorias: Array<{
    id: string;
    name: string;
    iconName: string;
    color: string;
  }>;
}

export default function KineClubClient({ beneficios, currentCat, categorias }: Props) {
  const router = useRouter();
  
  const handleCatChange = (catId: string) => {
    if (catId === "TODOS") {
      router.push("/kineclub", { scroll: false });
    } else {
      router.push(`/kineclub?cat=${catId}`, { scroll: false });
    }
  };

  return (
    <>
      <div className="bg-slate-900 pt-24 pb-32 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-black tracking-widest uppercase mb-8"
          >
            <Ticket className="mr-2 h-4 w-4" /> KineClub Mendoza
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 tracking-tighter"
          >
            Beneficios que <br /> <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">hacen la diferencia</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Ser parte del Círculo es mucho más que estar matriculado. Disfrutá de descuentos exclusivos en toda la provincia.
          </motion.p>
        </div>
        
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600 rounded-full blur-[150px]" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 -mt-16 relative z-20">
        <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-wrap justify-center gap-2 mb-12">
          {categorias.map((cat) => {
            const Icon = ICON_MAP[cat.iconName] || Tag;
            return (
              <button 
                key={cat.id}
                onClick={() => handleCatChange(cat.id)}
                className={cn(
                  "flex items-center px-6 py-3 rounded-2xl text-sm font-bold transition-all",
                  currentCat === cat.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <Icon className="mr-2 h-4 w-4" /> {cat.name}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {beneficios.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <ShoppingBag className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest">No hay beneficios en esta categoría aún.</p>
            </div>
          ) : (
            beneficios.map((b, idx) => (
              <motion.div 
                key={b.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group"
              >
                <div className="p-6 md:p-10">
                  <div className="flex items-start justify-between mb-8">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors overflow-hidden">
                      {b.logo_url ? (
                        <img src={b.logo_url} alt={b.empresa} className="h-full w-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-8 w-8" />
                      )}
                    </div>
                    <span className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-black tracking-wider uppercase">
                      {b.descuento}
                    </span>
                  </div>

                  <div className="mb-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{b.categoria.nombre}</p>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">{b.empresa}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                      {b.descripcion}
                    </p>
                  </div>

                  <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                    {b.url ? (
                      <a 
                        href={b.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-black text-slate-900 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center group"
                      >
                        Obtener Beneficio <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    ) : (
                      <span className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                        Consultar en local
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="mt-16 md:mt-24 text-center bg-blue-50 p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] border border-blue-100">
          <h2 className="text-3xl font-black text-slate-900 mb-4">¿Cómo utilizo los beneficios?</h2>
          <p className="text-slate-600 max-w-xl mx-auto mb-10 leading-relaxed">
            Es muy simple: presentá tu carnet digital o físico en cualquiera de los comercios adheridos y empezá a disfrutar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/admin" className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200">
              Ver mi Carnet Digital
            </Link>
            <Link href="/registro" className="px-10 py-5 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all">
              Aún no soy socio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
