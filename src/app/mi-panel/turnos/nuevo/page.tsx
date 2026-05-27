import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { PacienteRepository } from "@/lib/repositories/PacienteRepository";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TurnoForm from "../_components/TurnoForm";

export const dynamic = "force-dynamic";

export default async function NuevoTurnoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  const pacientes = await PacienteRepository.findAll(profesional.id);

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      <Link
        href="/mi-panel/turnos"
        className="flex items-center text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a turnos
      </Link>

      <div>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">
          Turnos
        </p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
          Nuevo Turno
        </h1>
      </div>

      <TurnoForm pacientes={pacientes} />
    </div>
  );
}
