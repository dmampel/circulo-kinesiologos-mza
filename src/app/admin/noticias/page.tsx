import prisma from "@/lib/prisma";
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import AdminSearch from "../_components/AdminSearch";
import { eliminarNoticiaAction } from "./actions";

export default async function NoticiasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const noticias = await prisma.noticia.findMany({
    where: query
      ? { titulo: { contains: query, mode: "insensitive" } }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Gestión de Noticias</h1>
          <p className="text-slate-500 font-medium">
            Publicá novedades, eventos y comunicados institucionales.
          </p>
        </div>
        <Link
          href="/admin/noticias/nueva"
          className="flex items-center px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 shrink-0"
        >
          <Plus className="mr-2 h-5 w-5" /> Nueva Noticia
        </Link>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-slate-900">Todas las Noticias</h3>
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-black">
              {noticias.length}
            </span>
          </div>
          <AdminSearch placeholder="Buscar noticia..." />
        </div>

        {noticias.length === 0 ? (
          <div className="py-20 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <FileText className="h-10 w-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              {query ? "Sin resultados" : "No hay noticias publicadas"}
            </h4>
            <p className="text-slate-500 mt-2">
              {query
                ? `No se encontraron noticias para "${query}".`
                : "Empezá creando tu primera comunicación."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Noticia
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
                {noticias.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-14 w-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {n.imagen_url ? (
                            <img
                              src={n.imagen_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                              <FileText className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {n.titulo}
                          </p>
                          <p className="text-xs text-slate-400 font-medium line-clamp-1">
                            {n.resumen || "Sin resumen"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          n.publicada
                            ? "bg-green-100 text-green-600"
                            : "bg-orange-100 text-orange-600"
                        )}
                      >
                        {n.publicada ? "Publicada" : "Borrador"}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-400 flex items-center uppercase tracking-wider">
                        <Clock className="mr-1.5 h-3 w-3" />
                        {n.publicada_en
                          ? new Date(n.publicada_en).toLocaleDateString("es-AR")
                          : new Date(n.createdAt).toLocaleDateString("es-AR")}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/noticias?noticia=${n.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all"
                          title="Ver en la web"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/noticias/editar/${n.id}`}
                          className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <form action={eliminarNoticiaAction.bind(null, n.id)}>
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
