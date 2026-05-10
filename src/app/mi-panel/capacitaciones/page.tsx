import { createClient } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";
import { redirect } from "next/navigation";
import { BookOpen, Calendar, MapPin, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cancelarInscripcionSocio } from "./actions";
import BotonInscripcion from "@/components/socio/BotonInscripcion";

export default async function CapacitacionesSocioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");

  const publicadas = await CapacitacionRepository.findPublicadas();
  const misInscripciones = await CapacitacionRepository.getInscripcionesSocio(profesional.id);

  // Armamos un Map de los IDs donde ya estoy inscripto y NO está cancelado para la UI
  const estadoInscripcionesMap = new Map(
    misInscripciones
      .filter((i) => i.estado !== "CANCELADA")
      .map((i) => [i.capacitacionId, i.estado])
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Mis Capacitaciones</h1>
        <p className="text-slate-500 font-medium">
          Anotate a cursos, congresos y jornadas de actualización.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cartelera (Columna Izquierda 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black text-slate-900 flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-blue-600" /> Cartelera Disponible
          </h2>

          {publicadas.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center">
              <p className="text-slate-500 font-medium">No hay capacitaciones abiertas en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {publicadas.map((c) => {
                const estadoInscripcion = estadoInscripcionesMap.get(c.id) || null;
                const yaInscripto = estadoInscripcion !== null;
                const sinCupo = c.cupoMaximo ? c._count.inscripciones >= c.cupoMaximo : false;

                return (
                  <div key={c.id} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row gap-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                            {c.tipo}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                            {c.modalidad}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900">{c.titulo}</h3>
                      </div>

                      <p className="text-sm text-slate-500 font-medium line-clamp-2">
                        {c.descripcion}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                        <div className="flex items-center">
                          <Calendar className="mr-1.5 h-4 w-4" />
                          {new Date(c.fechaInicio).toLocaleDateString()}
                        </div>
                        {c.ubicacion && (
                          <div className="flex items-center">
                            <MapPin className="mr-1.5 h-4 w-4" />
                            {c.ubicacion}
                          </div>
                        )}
                        {c.cupoMaximo && (
                          <div className="flex items-center text-orange-500">
                            Cupos: {c.cupoMaximo - c._count.inscripciones} libres
                          </div>
                        )}
                        {c.costo ? (
                          <div className="flex items-center text-green-600">
                            Costo: ${Number(c.costo).toLocaleString()}
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600">
                            Gratis
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:w-48 shrink-0 flex flex-col justify-center">
                      {sinCupo && !yaInscripto ? (
                        <div className="bg-slate-100 text-slate-400 font-bold p-3 rounded-xl text-center text-sm">
                          Cupo Agotado
                        </div>
                      ) : (
                        <BotonInscripcion 
                          profesionalId={profesional.id} 
                          capacitacionId={c.id} 
                          costo={c.costo ? Number(c.costo) : null} 
                          titulo={c.titulo} 
                          estadoInscripcion={estadoInscripcion}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mis Inscripciones (Columna Derecha 1/3) */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900">Historial</h2>
          <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6 space-y-4">
            {misInscripciones.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium text-center py-4">No tenés inscripciones previas.</p>
            ) : (
              misInscripciones.map((insc) => (
                <div key={insc.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />
                  <div className="pl-2">
                    <p className="text-sm font-black text-slate-900 line-clamp-1">{insc.capacitacion.titulo}</p>
                    <p className="text-xs text-slate-400 font-medium mb-3">
                      {new Date(insc.capacitacion.fechaInicio).toLocaleDateString()}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      {insc.estado === "PENDIENTE" && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-1 rounded-full flex items-center">
                          <Clock className="mr-1 h-3 w-3" /> Pendiente
                        </span>
                      )}
                      {insc.estado === "CONFIRMADA" && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmada
                        </span>
                      )}
                      {insc.estado === "CANCELADA" && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center">
                          <XCircle className="mr-1 h-3 w-3" /> Cancelada
                        </span>
                      )}

                      {insc.estado !== "CANCELADA" && (
                        <form action={cancelarInscripcionSocio.bind(null, insc.id, profesional.id)}>
                          <button type="submit" className="text-[10px] font-bold text-slate-400 hover:text-red-500 hover:underline transition-colors">
                            Bajarme
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
