"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  ShoppingBag, 
  Tag,
  Link as LinkIcon,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearBeneficio } from "../actions";

export const dynamic = "force-dynamic";

export default function NuevoBeneficioPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [categorias, setCategorias] = useState<{id: string, nombre: string}[]>([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      // Usamos una API route o invocamos una server action para obtenerlas
      // Por simplicidad, ya que estamos en Next 15+, podemos usar el repo si es server-side, 
      // pero como es client-side, vamos a crear una pequeña acción para esto.
      const res = await fetch("/api/categorias");
      const data = await res.json();
      setCategorias(data);
    };
    fetchCategorias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    
    const data = new FormData(e.target as HTMLFormElement);
    const result = await crearBeneficio(data);
    
    if (result.success) {
      router.push("/admin/beneficios");
    } else {
      alert("Error al crear beneficio: " + result.error);
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center space-x-4">
        <Link 
          href="/admin/beneficios" 
          className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-3xl font-black text-slate-900">Nuevo Beneficio</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Empresa</label>
            <div className="relative">
              <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <input 
                name="empresa"
                required
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold" 
                placeholder="Ej: Hotel Mendoza"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Descuento / Promo</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <input 
                name="descuento"
                required
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold" 
                placeholder="Ej: 20% OFF o 2x1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
            <select 
              name="categoriaId"
              required
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold appearance-none"
            >
              <option value="">Seleccionar categoría...</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Enlace (Opcional)</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <input 
                name="enlace"
                type="url"
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold" 
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="col-span-full space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Descripción del Beneficio</label>
            <textarea 
              name="descripcion"
              required
              rows={4}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium resize-none" 
              placeholder="Detallá en qué consiste el beneficio..."
            />
          </div>

          <div className="col-span-full space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Logo de la Empresa (URL)</label>
            <div className="space-y-4">
              <input 
                name="logo_url"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold" 
                placeholder="https://..."
              />
              <div className="relative group h-40 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center transition-all hover:border-blue-400">
                {logoUrl ? (
                  <img src={logoUrl} alt="Preview" className="h-full w-full object-contain p-4" />
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <ImageIcon className="h-10 w-10 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Vista Previa</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center py-5 rounded-2xl bg-blue-600 text-white font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isPending ? (
              <>Cargando... <Loader2 className="ml-2 h-5 w-5 animate-spin" /></>
            ) : (
              <>Guardar Beneficio <Save className="ml-2 h-5 w-5" /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
