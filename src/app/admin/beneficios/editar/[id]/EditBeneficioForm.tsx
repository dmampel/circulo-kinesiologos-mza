"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Save, 
  ShoppingBag, 
  Tag, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { actualizarBeneficio } from "../../actions";

interface Categoria {
  id: string;
  nombre: string;
}

interface Beneficio {
  id: string;
  empresa: string;
  descripcion: string;
  descuento: string | null;
  categoriaId: string;
  logo_url: string | null;
  url: string | null;
}

interface Props {
  beneficio: Beneficio;
  categorias: Categoria[];
}

export default function EditBeneficioForm({ beneficio, categorias }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [logoUrl, setLogoUrl] = useState(beneficio.logo_url || "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await actualizarBeneficio(beneficio.id, formData);
    
    if (result.success) {
      router.push("/admin/beneficios");
      router.refresh();
    } else {
      alert("Error: " + result.error);
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
        <h1 className="text-3xl font-black text-slate-900">Editar Beneficio</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Empresa</label>
            <div className="relative">
              <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <input 
                name="empresa"
                defaultValue={beneficio.empresa}
                required
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Descuento / Promo</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <input 
                name="descuento"
                defaultValue={beneficio.descuento || ""}
                required
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
            <select 
              name="categoriaId"
              defaultValue={beneficio.categoriaId}
              required
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold appearance-none"
            >
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">URL de la Empresa (Opcional)</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <input 
                name="enlace"
                defaultValue={beneficio.url || ""}
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold" 
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">URL del Logo</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <input 
                name="logo_url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                required
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold" 
                placeholder="Pegá la URL de la imagen aquí"
              />
            </div>
          </div>

          {logoUrl && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 inline-block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Previsualización</p>
              <div className="h-32 w-32 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                <img src={logoUrl} alt="Preview" className="h-full w-full object-contain p-2" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Descripción del Beneficio</label>
          <textarea 
            name="descripcion"
            defaultValue={beneficio.descripcion}
            required
            rows={4}
            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold resize-none" 
            placeholder="Contanos más sobre este beneficio..."
          />
        </div>

        <button 
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center py-6 rounded-[2rem] bg-slate-900 text-white font-black hover:bg-slate-800 transition-all hover:shadow-2xl hover:shadow-slate-200 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          ) : (
            <Save className="mr-2 h-6 w-6" />
          )}
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
