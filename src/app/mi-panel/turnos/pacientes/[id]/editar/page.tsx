import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { PacienteRepository } from "@/lib/repositories/PacienteRepository";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PacienteForm from "../../_components/PacienteForm";

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  const paciente = await PacienteRepository.findById(id, profesional.id);
  if (!paciente) notFound();

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
          Editar Paciente
        </h1>
      </div>

      <PacienteForm
        id={paciente.id}
        initialValues={{
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          telefono: paciente.telefono,
          email: paciente.email,
          notas: paciente.notas,
        }}
      />
    </div>
  );
}
