import { AutoridadRepository } from "@/lib/repositories/AutoridadRepository";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AutoridadForm from "../../_components/AutoridadForm";

export const dynamic = "force-dynamic";

export default async function EditarAutoridadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const autoridad = await AutoridadRepository.getById(id);

  if (!autoridad) {
    notFound();
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/autoridades"
          className="flex items-center text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al listado
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <AutoridadForm 
          id={id}
          profesional={{
            id: autoridad.profesionalId,
            nombre: autoridad.profesional.nombre,
            apellido: autoridad.profesional.apellido,
            matricula: autoridad.profesional.matricula
          }}
          initialValues={{
            cargo: autoridad.cargo,
            orden: autoridad.orden
          }}
        />
      </div>
    </div>
  );
}
