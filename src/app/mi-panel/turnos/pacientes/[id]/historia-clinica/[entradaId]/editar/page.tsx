import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { PacienteRepository } from "@/lib/repositories/PacienteRepository";
import { HistoriaClinicaRepository } from "@/lib/repositories/HistoriaClinicaRepository";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EntradaHistoriaForm from "../../_components/EntradaHistoriaForm";

export const dynamic = "force-dynamic";

export default async function EditarEntradaPage({
  params,
}: {
  params: Promise<{ id: string; entradaId: string }>;
}) {
  const { id, entradaId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  const paciente = await PacienteRepository.findById(id, profesional.id);
  if (!paciente) notFound();

  const entrada = await HistoriaClinicaRepository.findById(entradaId, id);
  if (!entrada) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      <Link
        href={`/mi-panel/turnos/pacientes/${id}`}
        className="flex items-center text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al paciente
      </Link>

      <div>
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">
          Historia Clínica · {paciente.apellido}, {paciente.nombre}
        </p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
          Editar Entrada
        </h1>
      </div>

      <EntradaHistoriaForm
        pacienteId={id}
        entradaId={entradaId}
        initialValues={{
          motivo: entrada.motivo,
          evolucion: entrada.evolucion,
          fecha: entrada.fecha,
        }}
      />
    </div>
  );
}
