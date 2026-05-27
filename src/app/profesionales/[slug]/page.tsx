import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  MapPin,
  Award,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import WaveTransition from "@/components/WaveTransition";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profesional = await prisma.profesional.findUnique({
    where: { slug, status: "ACTIVO" },
    include: { especialidades: true },
  });

  if (!profesional) return { title: "Profesional | CKM Mendoza" };

  const nombre = `${profesional.nombre} ${profesional.apellido}`;
  const especialidad = profesional.especialidades?.[0]?.nombre ?? "Kinesiólogo/a";
  const description = `Perfil de ${nombre} — ${especialidad}. Kinesiólogo/a habilitado/a en Mendoza registrado en el Círculo de Kinesiólogos.`;

  return {
    title: `${nombre} | CKM Mendoza`,
    description,
    openGraph: {
      title: nombre,
      description,
      images: profesional.foto_url ? [profesional.foto_url] : [],
      url: `https://www.circulokinesiologos.com.ar/profesionales/${slug}`,
    },
  };
}

export default async function PerfilProfesionalPage({ params }: Props) {
  const { slug } = await params;

  const profesional = await prisma.profesional.findUnique({
    where: { slug, status: "ACTIVO" },
    include: {
      localidad: true,
      especialidades: true,
    },
  });

  if (!profesional) notFound();

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 pt-20 pb-40 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <Link
            href="/profesionales"
            className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all mb-12 group"
          >
            <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Volver al buscador
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-10">
            <div className="h-48 w-48 rounded-[3rem] bg-white p-2 shadow-2xl shadow-blue-500/20 relative z-20 shrink-0 group">
              <div className="h-full w-full rounded-[2.5rem] bg-blue-50 flex items-center justify-center text-blue-600 overflow-hidden border border-slate-100">
                {profesional.foto_url ? (
                  <img
                    src={profesional.foto_url}
                    alt={profesional.full_name || ""}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <span className="text-5xl font-black">
                    {profesional.nombre[0]}
                    {profesional.apellido[0]}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center text-white shadow-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="text-center md:text-left pb-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
                <ShieldCheck className="h-3 w-3 mr-2" /> Profesional Habilitado
              </div>
              <h1 className="text-4xl lg:text-6xl font-black text-white mb-4 tracking-tighter uppercase leading-none">
                {profesional.apellido}, <br className="hidden lg:block" />
                <span className="text-blue-500">{profesional.nombre}</span>
              </h1>
              <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">
                Matrícula{" "}
                <span className="text-white ml-2">
                  M.P. {profesional.matricula}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-64 h-64 bg-blue-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[150px]" />
        </div>

        <WaveTransition color="text-slate-50" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-12 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-xl shadow-slate-200/50 border border-white">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                <h2 className="text-2xl font-black text-slate-900 flex items-center">
                  <Award className="mr-3 h-6 w-6 text-blue-600" />
                  Especialidades
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {profesional.especialidades.length > 0 ? (
                  profesional.especialidades.map((spec) => (
                    <div key={spec.id} className="group cursor-default">
                      <div className="px-6 py-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 font-bold flex items-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <CheckCircle2 className="h-4 w-4 mr-3 opacity-50 group-hover:opacity-100" />
                        {spec.nombre}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 font-bold">
                    Kinesiología General
                  </div>
                )}
              </div>

              <div className="mt-16">
                <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center">
                  <MapPin className="mr-3 h-6 w-6 text-blue-600" />
                  Ubicación y Consultorio
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-colors group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      Dirección Particular
                    </p>
                    <p className="text-xl font-black text-slate-900 mb-2 leading-tight">
                      {profesional.direccion || "Consultorio habilitado"}
                    </p>
                    <p className="text-blue-600 font-bold flex items-center uppercase text-xs tracking-wider mb-4">
                      <MapPin className="h-4 w-4 mr-2" />{" "}
                      {profesional.localidad.nombre}, Mendoza
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${profesional.direccion || ""} ${profesional.localidad.nombre} Mendoza Argentina`.trim()
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                    >
                     
                      Ver en Google Maps
                      <ExternalLink className="h-3 w-3 ml-auto text-slate-300" />
                    </a>
                  </div>

                  <div className="p-8 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-colors group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      Días y Horarios
                    </p>
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-blue-600 mr-3 mt-1 shrink-0" />
                      <div>
                        <p className="text-slate-700 font-bold leading-relaxed italic">
                          "
                          {profesional.horarios ||
                            "Consultar disponibilidad con el profesional"}
                          "
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Contact Actions */}
          <div className="space-y-6">
            <div className="bg-slate-20 rounded-[3rem] p-8 lg:p-10 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-8">
                  Contacto Directo
                </h4>

                <div className="space-y-4">
                  {profesional.whatsapp && (
                    <a
                      href={`https://wa.me/${profesional.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      className="w-full flex items-center justify-between p-5 rounded-2xl bg-green-600 hover:bg-green-500 transition-all font-black text-sm uppercase tracking-widest group/btn"
                    >
                      <span className="flex items-center">
                        <Phone className="mr-3 h-5 w-5" /> WhatsApp
                      </span>
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  )}

                  {profesional.email && (
                    <a
                      href={`mailto:${profesional.email}`}
                      className="w-full flex items-center justify-between text-slate-500 p-5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 font-black text-sm uppercase tracking-widest group/btn"
                    >
                      <span className="flex items-center">
                        <Mail className="mr-3 h-5 w-5" /> Enviar Email
                      </span>
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  )}
                </div>

                <div className="mt-10 pt-10 border-t border-white/10 text-center">
                  <div className="h-16 w-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                    <ShieldCheck className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                    Perfil Verificado <br />
                    <span className="text-blue-500">CKM Mendoza</span>
                  </p>
                </div>
              </div>

              {/* Decorative Glow inside sidebar */}
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-30" />
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 text-center shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                Información Importante
              </p>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Este profesional se encuentra al día con sus obligaciones
                colegiales y habilitado para el ejercicio de la profesión.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
