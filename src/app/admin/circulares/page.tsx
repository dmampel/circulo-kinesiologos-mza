import { CircularRepository } from "@/lib/repositories/CircularRepository";
import { deleteCircular, togglePublicada } from "./actions";
import { Plus, Megaphone, Edit, Trash2, Clock, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import AdminSearch from "../_components/AdminSearch";

export const dynamic = "force-dynamic";

export default async function CircularesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";

  const todasLasCirculares = await CircularRepository.getAll();
  const circulares = query
    ? todasLasCirculares.filter(
        (c: (typeof todasLasCirculares)[number]) =>
          c.titulo.toLowerCase().includes(query) ||
          c.etiqueta.toLowerCase().includes(query)
      )
    : todasLasCirculares;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Gestión de Circulares</h1>
          <p className="text-slate-500 font-medium">
            Publicá avisos administrativos y comunicaciones exclusivas para socios.
          </p>
        </div>
        <Link
          href="/admin/circulares/nueva"
          className="flex items-center px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 shrink-0"
        >
          <Plus className="mr-2 h-5 w-5" /> Nueva Circular
        </Link>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-slate-900">Todas las Circulares</h3>
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-black">
              {circulares.length}
            </span>
          </div>
          <AdminSearch placeholder="Buscar circular..." />
        </div>

        {circulares.length === 0 ? (
          <div className="py-20 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Megaphone className="h-10 w-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              {query ? "Sin resultados" : "No hay circulares publicadas"}
            </h4>
            <p className="text-slate-500 mt-2">
              {query
                ? `No se encontraron circulares para "${query}".`
                : "Creá el primer comunicado para tus socios."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Circular
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Estado
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Fecha
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {circulares.map((c: (typeof todasLasCirculares)[number]) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-block self-start text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {c.etiqueta}
                        </span>
                        <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                          {c.titulo}
                        </p>
                        {c.archivo_url && (
                          <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            <LinkIcon className="mr-1 h-3 w-3" /> Archivo Adjunto
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <form action={togglePublicada.bind(null, c.id, c.publicada)}>
                        <button
                          type="submit"
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            c.publicada
                              ? "bg-green-100 text-green-600 hover:bg-green-200"
                              : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                          )}
                        >
                          {c.publicada ? "Publicada" : "Borrador"}
                        </button>
                      </form>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-400 flex items-center uppercase tracking-wider">
                        <Clock className="mr-1.5 h-3 w-3" />
                        {c.publicada_en
                          ? new Date(c.publicada_en).toLocaleDateString("es-AR")
                          : new Date(c.createdAt).toLocaleDateString("es-AR")}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/circulares/editar/${c.id}`}
                          className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <form action={deleteCircular.bind(null, c.id)}>
                          <button
                            type="submit"
                            className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
