import { createCircular } from "../actions";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function NuevaCircularPage() {
  async function action(formData: FormData) {
    "use server";
    await createCircular(formData);
    redirect("/admin/circulares");
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link 
          href="/admin/circulares"
          className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">Nueva Circular</h1>
          <p className="text-slate-500 font-medium">Completá los datos del comunicado.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden p-8">
        <form action={action} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="titulo" className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Título de la Circular
              </label>
              <input 
                type="text" 
                id="titulo"
                name="titulo"
                required
                placeholder="Ej: Actualización del Vademécum"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="etiqueta" className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Etiqueta / Categoría
              </label>
              <input 
                type="text" 
                id="etiqueta"
                name="etiqueta"
                required
                placeholder="Ej: Circular Nº 124, Institucional, Salud"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="contenido" className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Contenido (Opcional)
            </label>
            <textarea 
              id="contenido"
              name="contenido"
              rows={5}
              placeholder="Escribí acá el desarrollo de la circular (texto plano)..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium resize-none"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900">Archivo Adjunto (Opcional)</h3>
            <p className="text-sm text-slate-500">Podés subir un archivo directamente o pegar un link a un archivo externo.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="archivo_file" className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Subir Archivo
                </label>
                <input 
                  type="file" 
                  id="archivo_file"
                  name="archivo_file"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="archivo_url" className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  O pegar URL externa
                </label>
                <input 
                  type="url" 
                  id="archivo_url"
                  name="archivo_url"
                  placeholder="Ej: https://link-a-un-pdf.com/archivo.pdf"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    id="publicada"
                    name="publicada"
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label htmlFor="publicada" className="font-bold text-slate-900">
                    Publicar inmediatamente
                  </label>
                  <p className="text-slate-500">Si no lo marcás, se guardará como borrador.</p>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="flex items-center px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
            >
              <Save className="mr-2 h-5 w-5" /> Guardar Circular
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
