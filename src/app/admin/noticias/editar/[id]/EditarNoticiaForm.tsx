"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Save,
  Eye,
  Type,
  Loader2,
  CheckCircle2,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { actualizarNoticia } from "../../actions";
import GaleriaImagenesInput from "../../GaleriaImagenesInput";
import type { Noticia, CategoriaNoticia, NoticiaImagen } from "@prisma/client";

interface Props {
  noticia: Noticia & { imagenes: NoticiaImagen[] };
  categorias: CategoriaNoticia[];
}

export default function EditarNoticiaForm({ noticia, categorias }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    titulo: noticia.titulo,
    resumen: noticia.resumen ?? "",
    contenido: noticia.contenido,
    publicada: noticia.publicada,
    categoriaId: noticia.categoriaId ?? "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    const data = new FormData(e.target as HTMLFormElement);
    const result = await actualizarNoticia(noticia.id, data);

    if (result.success) {
      router.push("/admin/noticias");
    } else {
      alert("Error al guardar los cambios: " + result.error);
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/noticias"
            className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-black text-slate-900">Editar Noticia</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Título de la Noticia
                </label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                  <input
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-lg font-black"
                    placeholder="Ej: Gran avance en el convenio con..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Resumen / Bajada
                </label>
                <textarea
                  name="resumen"
                  value={formData.resumen}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium resize-none"
                  placeholder="Una breve descripción para los listados..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Contenido Principal
                </label>
                <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100">
                  <textarea
                    name="contenido"
                    value={formData.contenido}
                    onChange={handleChange}
                    required
                    rows={12}
                    className="w-full px-4 py-4 bg-transparent border-none focus:ring-0 text-sm font-medium leading-relaxed"
                    placeholder="Escribí el contenido de la noticia aquí..."
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight ml-2">
                  Soporta formato básico y saltos de línea.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">

              {/* Categoría */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Categoría
                </label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                  <select
                    name="categoriaId"
                    value={formData.categoriaId}
                    onChange={handleChange}
                    className="w-full appearance-none pl-10 pr-8 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold text-slate-700"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Imágenes de Portada
                </label>
                <GaleriaImagenesInput name="imagenes" defaultValue={noticia.imagenes} />
              </div>

              <hr className="border-slate-50" />

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <Eye className="h-5 w-5 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">¿Publicada?</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="publicada"
                    checked={formData.publicada}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-4 rounded-2xl bg-blue-600 text-white font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    Guardando... <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  </>
                ) : (
                  <>
                    Guardar Cambios <Save className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">
                Tips de Edición
              </h4>
              <ul className="text-xs space-y-3 font-medium text-slate-400">
                <li className="flex items-start">
                  <CheckCircle2 className="h-3 w-3 mr-2 text-blue-500 mt-0.5" /> Cambiar el título
                  regenera el slug (URL).
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-3 w-3 mr-2 text-blue-500 mt-0.5" /> El resumen aparece
                  en la portada.
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-3 w-3 mr-2 text-blue-500 mt-0.5" /> Imágenes
                  horizontales (16:9) recomendadas.
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-3 w-3 mr-2 text-blue-500 mt-0.5" /> La primera
                  imagen de la galería es la portada: se usa en los listados y al compartir.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
