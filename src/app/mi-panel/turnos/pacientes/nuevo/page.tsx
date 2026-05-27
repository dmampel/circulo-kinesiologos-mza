import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PacienteForm from "../_components/PacienteForm";

export const dynamic = "force-dynamic";

export default function NuevoPacientePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      <Link
        href="/mi-panel/turnos/pacientes"
        className="flex items-center text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a pacientes
      </Link>

      <div>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">
          Turnos · Pacientes
        </p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
          Nuevo Paciente
        </h1>
      </div>

      <PacienteForm />
    </div>
  );
}
