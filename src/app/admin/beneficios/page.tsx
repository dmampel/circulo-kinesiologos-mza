import prisma from "@/lib/prisma";
import {
  Plus,
  ShoppingBag,
  Edit,
  Trash2,
  ExternalLink,
  Tag,
} from "lucide-react";
import Link from "next/link";
import CategoriaSidebar from "./CategoriaSidebar";
import { CategoriaRepository } from "@/lib/repositories/CategoriaRepository";
import AdminSearch from "../_components/AdminSearch";
import SafeLogoImage from "../_components/SafeLogoImage";

export default async function BeneficiosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [beneficios, categorias] = await Promise.all([
    prisma.beneficioKineClub.findMany({
      where: query
        ? {
            OR: [
              { empresa: { contains: query, mode: "insensitive" } },
              { descripcion: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: { categoria: true },
      orderBy: { createdAt: "desc" },
    }),
    CategoriaRepository.getAll(),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
            Gestión de KineClub
          </h1>
          <p className="text-slate-500 font-medium">
            Administrá los beneficios y convenios para socios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CategoriaSidebar categorias={categorias} />
          <Link
            href="/admin/beneficios/nuevo"
            className="flex items-center px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 shrink-0"
          >
            <Plus className="mr-2 h-5 w-5" /> Nuevo Beneficio
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 md:p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-slate-900">Beneficios Activos</h3>
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-black">
              {beneficios.length}
            </span>
          </div>
          <AdminSearch placeholder="Buscar beneficio..." />
        </div>

        {beneficios.length === 0 ? (
          <div className="py-20 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              {query ? "Sin resultados" : "No hay beneficios cargados"}
            </h4>
            <p className="text-slate-500 mt-2">
              {query
                ? `No se encontraron beneficios para "${query}".`
                : "Cargá el primer beneficio para el KineClub."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-4 md:px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Empresa
                  </th>
                  <th className="px-4 md:px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Descuento
                  </th>
                  <th className="px-4 md:px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Categoría
                  </th>
                  <th className="px-4 md:px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {beneficios.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 md:px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center text-slate-300">
                          {b.logo_url ? (
                            <SafeLogoImage
                              src={b.logo_url}
                              alt={b.empresa}
                              className="h-full w-full object-cover"
                              fallback={<ShoppingBag className="h-6 w-6 text-slate-300" />}
                            />
                          ) : (
                            <ShoppingBag className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{b.empresa}</p>
                          <p className="text-xs text-slate-400 font-medium line-clamp-1">
                            {b.descripcion}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-6">
                      <span className="inline-flex whitespace-nowrap px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        {b.descuento}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-6">
                      <p className="text-xs font-bold text-slate-400 flex items-center uppercase tracking-wider">
                        <Tag className="mr-1.5 h-3 w-3" /> {b.categoria?.nombre}
                      </p>
                    </td>
                    <td className="px-4 md:px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/kineclub?cat=${b.categoria?.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/beneficios/editar/${b.id}`}
                          className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600 transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
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
