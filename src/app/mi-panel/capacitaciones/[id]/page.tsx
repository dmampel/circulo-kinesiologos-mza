import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Wallet,
  MessageCircle,
  Mail,
} from "lucide-react";
import BotonInscripcion from "@/components/socio/BotonInscripcion";
import BotonCancelarInscripcion from "@/components/socio/BotonCancelarInscripcion";

function tieneHora(fecha: Date): boolean {
  return fecha.getUTCHours() !== 0 || fecha.getUTCMinutes() !== 0;
}

function calcularCountdown(fechaInicio: Date): { texto: string; estilo: string } {
  const ahora = new Date();
  const diffMs = fechaInicio.getTime() - ahora.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return { texto: "Ya comenzó", estilo: "bg-slate-100 text-slate-500" };
  if (diffDias === 0) return { texto: "¡Hoy!", estilo: "bg-red-50 text-red-600 border border-red-100" };
  if (diffDias === 1) return { texto: "Mañana", estilo: "bg-amber-50 text-amber-600 border border-amber-100" };
  if (diffDias <= 7) return { texto: `Esta semana · Faltan ${diffDias} días`, estilo: "bg-amber-50 text-amber-600 border border-amber-100" };
  return { texto: `Faltan ${diffDias} días`, estilo: "bg-blue-50 text-blue-600 border border-blue-100" };
}

function calcularBarraCupos(ocupados: number, maximo: number): { porcentaje: number; color: string } {
  const porcentaje = Math.min((ocupados / maximo) * 100, 100);
  const color =
    porcentaje < 60 ? "bg-green-400" :
    porcentaje <= 85 ? "bg-amber-400" :
    "bg-red-400";
  return { porcentaje, color };
}

export default async function CapacitacionDetalleSocioPage({
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

  const capacitacion = await CapacitacionRepository.findPublicadaById(id);
  if (!capacitacion) notFound();

  const inscripcion = await CapacitacionRepository.getInscripcionSocio(profesional.id, id);

  // Fechas
  const fechaInicio = new Date(capacitacion.fechaInicio);
  const fechaStr = fechaInicio.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const horaStr = tieneHora(fechaInicio)
    ? fechaInicio.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    : null;
  const fechaFin = capacitacion.fechaFin ? new Date(capacitacion.fechaFin) : null;
  const fechaFinStr = fechaFin
    ? fechaFin.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  // Countdown (tasks 1.1-1.2)
  const countdown = calcularCountdown(fechaInicio);

  // Cupos (tasks 2.1-2.2)
  const cuposOcupados = capacitacion._count.inscripciones;
  const cuposRestantes = capacitacion.cupoMaximo
    ? capacitacion.cupoMaximo - cuposOcupados
    : null;
  const sinCupo = cuposRestantes !== null && cuposRestantes <= 0;
  const barraCupos = capacitacion.cupoMaximo
    ? calcularBarraCupos(cuposOcupados, capacitacion.cupoMaximo)
    : null;

  // Maps link (task 3.1)
  const mapsUrl =
    capacitacion.modalidad !== "VIRTUAL" && capacitacion.ubicacion
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(capacitacion.ubicacion)}`
      : null;

  // Datos bancarios (task 4.1)
  const cbu = process.env.NEXT_PUBLIC_CBU ?? "";
  const alias = process.env.NEXT_PUBLIC_ALIAS ?? "";
  const titular = process.env.NEXT_PUBLIC_TITULAR ?? "";
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
  const pagosEmail = process.env.NEXT_PUBLIC_PAGOS_EMAIL ?? "";
  const mostrarDatosBancarios =
    inscripcion?.estado === "PENDIENTE" && Number(capacitacion.costo) > 0;
  const whatsappMsg = `Hola, envío el comprobante de pago para la capacitación "${capacitacion.titulo}". Mi matrícula es: `;
  const emailSubject = `Comprobante de Pago - ${capacitacion.titulo}`;

  const estadoInscripcion = inscripcion?.estado ?? null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/mi-panel/capacitaciones"
          className="mt-1 p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
              {capacitacion.tipo}
            </span>
            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200">
              {capacitacion.modalidad}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
            {capacitacion.titulo}
          </h1>
          {/* Countdown badge (task 1.3) */}
          <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${countdown.estilo}`}>
            {countdown.texto}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CTA card — mobile: first; desktop: right column */}
        <div className="order-first lg:order-last lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 lg:sticky lg:top-6">
            {/* Precio */}
            <div className="text-center pb-5 border-b border-slate-50">
              {capacitacion.costo ? (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Costo
                  </p>
                  <p className="text-4xl font-black text-slate-900">
                    ${Number(capacitacion.costo).toLocaleString("es-AR")}
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <p className="text-2xl font-black text-green-600">Sin costo</p>
                </div>
              )}
            </div>

            {/* Cupos resumido */}
            {cuposRestantes !== null && (
              <p className={`text-xs font-bold text-center ${
                cuposRestantes === 0 ? "text-red-500" :
                cuposRestantes <= 3 ? "text-red-500" :
                cuposRestantes <= 10 ? "text-amber-500" :
                "text-slate-400"
              }`}>
                {cuposRestantes === 0
                  ? "Sin cupos disponibles"
                  : `${cuposRestantes} ${cuposRestantes === 1 ? "cupo disponible" : "cupos disponibles"}`}
              </p>
            )}

            {/* Botón principal */}
            {sinCupo && !inscripcion ? (
              <div className="bg-slate-100 text-slate-400 font-bold p-3 rounded-xl text-center text-sm flex items-center justify-center gap-2">
                <Wallet className="h-4 w-4" /> Cupo Agotado
              </div>
            ) : (
              <BotonInscripcion
                profesionalId={profesional.id}
                capacitacionId={capacitacion.id}
                costo={capacitacion.costo ? Number(capacitacion.costo) : null}
                titulo={capacitacion.titulo}
                estadoInscripcion={estadoInscripcion}
              />
            )}

            {/* Datos bancarios inline (tasks 4.2-4.3) */}
            {mostrarDatosBancarios && (
              <div className="space-y-4 pt-2 border-t border-amber-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 text-center">
                  Datos de transferencia
                </p>
                <div className="bg-amber-50 rounded-2xl p-4 space-y-3 border border-amber-100">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alias</p>
                    <p className="font-bold text-slate-900 select-all text-sm">{alias}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">CBU</p>
                    <p className="font-bold text-slate-900 select-all text-sm break-all">{cbu}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Titular</p>
                    <p className="font-bold text-slate-900 text-sm">{titular}</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium text-center">
                  Envianos el comprobante con tu matrícula:
                </p>
                <div className="space-y-2">
                  <a
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappMsg)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center p-2.5 rounded-xl bg-green-50 text-green-600 font-bold hover:bg-green-100 transition-colors border border-green-200 text-sm"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                  </a>
                  <a
                    href={`mailto:${pagosEmail}?subject=${encodeURIComponent(emailSubject)}`}
                    className="w-full flex items-center justify-center p-2.5 rounded-xl bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 transition-colors border border-slate-200 text-sm"
                  >
                    <Mail className="mr-2 h-4 w-4" /> Email
                  </a>
                </div>
              </div>
            )}

            {/* Cancelar inscripción */}
            {inscripcion && (
              <div className="pt-4 border-t border-slate-50 text-center">
                <BotonCancelarInscripcion
                  inscripcionId={inscripcion.id}
                  profesionalId={profesional.id}
                />
              </div>
            )}
          </div>
        </div>

        {/* Info principal */}
        <div className="lg:col-span-2 space-y-8">
          {/* Descripción */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              Descripción
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">
              {capacitacion.descripcion}
            </p>
          </div>

          {/* Detalles */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
              Detalles del Evento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Fecha */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-xl shrink-0">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Fecha
                  </p>
                  <p className="font-bold text-slate-900 capitalize">{fechaStr}</p>
                  {fechaFinStr && (
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Hasta el {fechaFinStr}
                    </p>
                  )}
                </div>
              </div>

              {/* Hora */}
              {horaStr && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl shrink-0">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                      Hora
                    </p>
                    <p className="font-bold text-slate-900">{horaStr} hs</p>
                  </div>
                </div>
              )}

              {/* Ubicación + Maps (tasks 3.1-3.2) */}
              {capacitacion.ubicacion && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl shrink-0">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                      {capacitacion.modalidad === "VIRTUAL" ? "Plataforma" : "Ubicación"}
                    </p>
                    <p className="font-bold text-slate-900">{capacitacion.ubicacion}</p>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline mt-0.5 inline-block"
                      >
                        Ver en Maps →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Cupos con barra (tasks 2.3) */}
              {capacitacion.cupoMaximo && barraCupos && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl shrink-0">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                      Cupos
                    </p>
                    <p className="font-bold text-slate-900 mb-2">
                      {cuposRestantes} de {capacitacion.cupoMaximo} disponibles
                    </p>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barraCupos.color}`}
                        style={{ width: `${barraCupos.porcentaje}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
