import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { PacienteRepository } from "@/lib/repositories/PacienteRepository";
import Link from "next/link";
import { UserPlus, Pencil, Users } from "lucide-react";
import DeletePacienteButton from "./_components/DeletePacienteButton";

export default async function PacientesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  const pacientes = await PacienteRepository.findAll(profesional.id);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
            Turnos · Gestión
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            Mis Pacientes
          </h1>
        </div>
        <Link
          href="/mi-panel/turnos/pacientes/nuevo"
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Paciente
        </Link>
      </div>

      {pacientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Users className="h-12 w-12 text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-400 uppercase tracking-tight">
            Sin pacientes todavía
          </h3>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            Agregá tu primer paciente para empezar a gestionar turnos.
          </p>
          <Link
            href="/mi-panel/turnos/pacientes/nuevo"
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-black rounded-2xl hover:bg-blue-700 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Crear primer paciente
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {pacientes.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm shrink-0">
                    {p.apellido.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">
                      {p.apellido}, {p.nombre}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {[p.telefono, p.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/mi-panel/turnos/pacientes/${p.id}/editar`}
                    className="p-2 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Editar paciente"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeletePacienteButton id={p.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
