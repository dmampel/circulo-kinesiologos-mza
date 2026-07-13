import { createClient } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { SorteoRepository } from "@/lib/repositories/SorteoRepository";
import { InscripcionSorteoRepository } from "@/lib/repositories/InscripcionSorteoRepository";
import { redirect } from "next/navigation";
import { Gift, Trophy, Calendar, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { inscribirmeAlSorteo, desinscribirmeDelSorteo } from "./actions";

export const dynamic = "force-dynamic";

type SorteoPublico = Awaited<ReturnType<typeof SorteoRepository.findForSocios>>[number];

export default async function SorteosSocioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  const sorteos = await SorteoRepository.findForSocios();
  const misInscripciones = await InscripcionSorteoRepository.findByProfesional(profesional.id);
  const inscriptosSet = new Set(misInscripciones.map((i) => i.sorteoId));

  const sorteosActivos = sorteos.filter((s) => s.estado === "ACTIVO");
  const sorteosRealizados = sorteos.filter((s) => s.estado === "REALIZADO");

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-500">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Panel Profesional · CKM</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Sorteos</h1>
        <p className="text-sm text-slate-500 font-medium pt-1">Participá en los sorteos exclusivos para socios del Círculo.</p>
      </div>

      {/* Sorteos activos */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Gift className="h-5 w-5 text-blue-600" /> Sorteos Activos
        </h2>

        {sorteosActivos.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Gift className="h-8 w-8" />
            </div>
            <p className="text-slate-500 font-medium">No hay sorteos activos en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {sorteosActivos.map((sorteo: SorteoPublico) => {
              const yaInscripto = inscriptosSet.has(sorteo.id);
              return (
                <SorteoCard
                  key={sorteo.id}
                  sorteo={sorteo}
                  yaInscripto={yaInscripto}
                  profesionalId={profesional.id}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Sorteos realizados */}
      {sorteosRealizados.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" /> Sorteos Realizados
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {sorteosRealizados.map((sorteo: SorteoPublico) => {
              const participé = inscriptosSet.has(sorteo.id);
              const gané = sorteo.ganador?.id === profesional.id;
              return (
                <div
                  key={sorteo.id}
                  className={cn(
                    "bg-white rounded-3xl border p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center",
                    gané ? "border-amber-200 bg-amber-50" : "border-slate-100"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                        Realizado
                      </span>
                      {gané && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                          <Trophy className="h-3 w-3" /> ¡Ganaste!
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-slate-900">{sorteo.titulo}</h3>
                    {sorteo.ganador && (
                      <p className="text-sm text-slate-500 font-medium mt-1">
                        Ganador: <span className="font-bold text-slate-700">{sorteo.ganador.nombre} {sorteo.ganador.apellido}</span> — M.P. {sorteo.ganador.matricula}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {participé ? (
                      <span className="text-xs font-black text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Participaste
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">No participaste</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SorteoCard({
  sorteo,
  yaInscripto,
}: {
  sorteo: SorteoPublico;
  yaInscripto: boolean;
  profesionalId: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 flex flex-col md:flex-row gap-6 hover:shadow-lg transition-all duration-300">
      {sorteo.imagen_url && (
        <div className="md:w-48 shrink-0">
          <img
            src={sorteo.imagen_url}
            alt={sorteo.titulo}
            className="w-full h-32 md:h-full object-cover rounded-2xl"
          />
        </div>
      )}

      <div className="flex-1 space-y-4">
        <div>
          <h3 className="text-lg font-black text-slate-900">{sorteo.titulo}</h3>
          <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-2">{sorteo.descripcion}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Inicio: {new Date(sorteo.fechaInicio).toLocaleDateString("es-AR")}
          </div>
          {sorteo.fechaCierre && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-orange-400" />
              Cierre: {new Date(sorteo.fechaCierre).toLocaleDateString("es-AR")}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {sorteo._count.inscripciones} inscriptos
            {sorteo.maxParticipantes && ` / ${sorteo.maxParticipantes}`}
          </div>
        </div>
      </div>

      <div className="md:w-44 shrink-0 flex flex-col justify-center">
        {yaInscripto ? (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-black text-green-700">Ya participás</span>
            </div>
            <form action={desinscribirmeDelSorteo.bind(null, sorteo.id)}>
              <button
                type="submit"
                className="w-full text-xs font-bold text-slate-400 hover:text-red-500 transition-colors py-1"
              >
                Cancelar participación
              </button>
            </form>
          </div>
        ) : (
          <form action={inscribirmeAlSorteo.bind(null, sorteo.id)}>
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              Participar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
