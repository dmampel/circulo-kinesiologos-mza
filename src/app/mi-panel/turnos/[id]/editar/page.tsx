import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { PacienteRepository } from "@/lib/repositories/PacienteRepository";
import { TurnoRepository } from "@/lib/repositories/TurnoRepository";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TurnoForm from "../../_components/TurnoForm";

export const dynamic = "force-dynamic";

function toDateInput(date: Date) {
  return new Date(date).toISOString().split("T")[0];
}

// Prisma stores dates in UTC — Intl is required to extract the time in AR timezone
function toTimeInput(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Mendoza",
  }).format(new Date(date));
}

export default async function EditarTurnoPage({
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

  const [turno, pacientes] = await Promise.all([
    TurnoRepository.findById(id, profesional.id),
    PacienteRepository.findAll(profesional.id),
  ]);

  if (!turno) notFound();

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
          Editar Turno
        </h1>
      </div>

      <TurnoForm
        pacientes={pacientes}
        id={turno.id}
        initialValues={{
          pacienteId: turno.pacienteId,
          fecha: toDateInput(turno.fecha),
          hora: toTimeInput(turno.fecha),
          duracion: turno.duracion,
          motivo: turno.motivo,
          notas: turno.notas,
          estado: turno.estado,
        }}
      />
    </div>
  );
}
