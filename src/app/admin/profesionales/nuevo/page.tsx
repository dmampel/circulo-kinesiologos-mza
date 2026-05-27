import { getLocalidadesYEspecialidades } from "../actions";
import FormProfesional from "../FormProfesional";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NuevoProfesionalPage() {
  const { localidades, especialidades } = await getLocalidadesYEspecialidades();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <Link href="/admin/profesionales" className="text-slate-400 hover:text-blue-600 font-bold flex items-center mb-4 transition-colors w-max">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al padrón
        </Link>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Nuevo Profesional</h1>
        <p className="text-slate-500 font-medium">Completá los datos para dar de alta a un profesional de forma manual.</p>
      </div>

      <FormProfesional localidades={localidades} especialidades={especialidades} />
    </div>
  );
}
