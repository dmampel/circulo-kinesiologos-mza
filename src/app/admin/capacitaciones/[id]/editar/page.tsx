import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import EditarCapacitacionForm from "./EditarCapacitacionForm";

export default async function EditarCapacitacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const capacitacion = await CapacitacionRepository.findById(id);

  if (!capacitacion) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/capacitaciones"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Editar Capacitación</h1>
          <p className="text-sm text-slate-500 font-medium">{capacitacion.titulo}</p>
        </div>
      </div>

      <EditarCapacitacionForm capacitacion={capacitacion} />
    </div>
  );
}
