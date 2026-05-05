import { getLocalidadesYEspecialidades } from "../actions";
import FormProfesional from "../FormProfesional";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditarProfesionalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const profesional = await prisma.profesional.findUnique({
    where: { id },
    include: { especialidades: true }
  });

  if (!profesional) {
    notFound();
  }

  const { localidades, especialidades } = await getLocalidadesYEspecialidades();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <Link href="/admin/profesionales" className="text-slate-400 hover:text-blue-600 font-bold flex items-center mb-4 transition-colors w-max">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al padrón
        </Link>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Editar Profesional</h1>
        <p className="text-slate-500 font-medium">Modificá los datos del profesional en el sistema.</p>
      </div>

      <FormProfesional 
        profesional={profesional} 
        localidades={localidades} 
        especialidades={especialidades} 
      />
    </div>
  );
}
