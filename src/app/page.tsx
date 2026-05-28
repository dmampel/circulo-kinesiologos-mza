import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  MapPin,
  Award,
  Users,
  ShieldCheck,
  ChevronRight,
  Newspaper,
  Monitor,
  CheckCircle,
  CreditCard,
  CalendarDays,
  UserCircle,
} from "lucide-react";
import WaveTransition from "@/components/WaveTransition";
import FloatingStatPills from "@/components/FloatingStatPills";
import CtaPills from "@/components/CtaPills";
import ScrollReveal, { StaggerItem } from "@/components/ScrollReveal";
import HeroGlows from "@/components/HeroGlows";
import TextReveal from "@/components/TextReveal";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { ObraSocialRepository } from "@/lib/repositories/ObraSocialRepository";
import { BeneficioRepository } from "@/lib/repositories/BeneficioRepository";
import { NoticiaRepository } from "@/lib/repositories/NoticiaRepository";
import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";

export const dynamic = "force-dynamic";

const TIPO_BADGE: Record<string, string> = {
  CURSO: "bg-blue-100 text-blue-700",
  TALLER: "bg-emerald-100 text-emerald-700",
  CONGRESO: "bg-purple-100 text-purple-700",
  ASAMBLEA: "bg-amber-100 text-amber-700",
};

const MODALIDAD_ICON: Record<string, React.ElementType> = {
  PRESENCIAL: MapPin,
  VIRTUAL: Monitor,
  HIBRIDO: Users,
};

export default async function Home() {
  const hoy = new Date();

  const [
    { total: totalProfesionales },
    obrasSociales,
    todosLosBeneficios,
    todasLasNoticias,
    capacitaciones,
  ] = await Promise.all([
    ProfesionalRepository.findPaginated(1, 1),
    ObraSocialRepository.getAllActive(),
    BeneficioRepository.getAll(),
    NoticiaRepository.getLatest(),
    CapacitacionRepository.findPublicadas(),
  ]);

  const activeBeneficios = todosLosBeneficios.filter((b) => b.activa);
  const beneficiosFeatured = activeBeneficios.slice(0, 3);
  const ultimasNoticias = todasLasNoticias.filter((n) => n.publicada).slice(0, 3);
  const proximasCapacitaciones = capacitaciones
    .filter((c) => new Date(c.fechaInicio) >= hoy)
    .slice(0, 3);

  const stats = [
    { label: "Profesionales registrados", value: `+${totalProfesionales}`, icon: Users },
    { label: "Obras sociales activas", value: `+${obrasSociales.length}`, icon: ShieldCheck },
    { label: "Beneficios KineClub", value: `+${activeBeneficios.length}`, icon: Award },
  ];

  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-slate-900 pt-40 pb-80 relative overflow-hidden">

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        <HeroGlows />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* LEFT: Copy */}
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-black tracking-widest uppercase mb-8">
                Institución Centenaria · Mendoza
              </div>
              <TextReveal as="h1" variant="words" className="text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-tighter leading-[1.05] mb-6">
                Somos{" "}
                <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">
                  El Círculo
                </span>{" "}
                de Kinesiólogos y Fisioterapeutas 
              </TextReveal>
              <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg">
                Representamos y acompañamos a los profesionales de la salud kinésica, garantizando la calidad prestacional y el desarrollo continuo de la disciplina.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/profesionales"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-blue-600 text-white font-black shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:shadow-blue-500/50 transition-all"
                >
                  Buscar Profesional <Search className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/registro"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/30 text-white font-black hover:bg-white hover:text-slate-900 transition-all"
                >
                  Asociate <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* RIGHT: Floating stat pills */}
            <div>
              <FloatingStatPills
                profesionales={totalProfesionales}
                obrasSociales={obrasSociales.length}
                beneficios={activeBeneficios.length}
              />
            </div>

          </div>
        </div>

        <WaveTransition color="text-slate-50" position="bottom" />
      </div>
      </section>

      {/* ── POR QUÉ ASOCIARTE ────────────────────────────────── */}
      <section className="min-h-screen flex items-center py-16 bg-slate-50">
        <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Top: Editorial header */}
          <ScrollReveal className="mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4 block">
              Ser parte del Círculo
            </span>
            <TextReveal className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-tight mb-6">
              Más que una matrícula.{" "}
              <span className="text-slate-400">Una comunidad.</span>
            </TextReveal>
            <p className="text-slate-500 leading-relaxed mb-4 max-w-xl">
              El Círculo de Kinesiólogos de Mendoza es la institución que te respalda en cada etapa de tu carrera — desde los primeros pasos hasta el desarrollo profesional continuo. No estás solo.
            </p>
            <Link
              href="/institucional"
              className="inline-flex items-center text-sm font-black text-slate-800 hover:text-blue-600 transition-colors"
            >
              Conocé nuestra institución <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </ScrollReveal>

          {/* Bottom: Pillars horizontal */}
          <ScrollReveal
            variant="staggerContainer"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-200"
          >
            {[
              { title: "Respaldo gremial", desc: "Negociamos aranceles y convenios dignos para que tu trabajo sea reconocido.", icon: ShieldCheck },
              { title: "Red de pacientes", desc: "Tu perfil en el padrón público para que nuevos pacientes te encuentren.", icon: Users },
              { title: "Formación continua", desc: "Acceso a cursos, talleres y congresos para mantenerte actualizado.", icon: Award },
              { title: "Beneficios exclusivos", desc: "Descuentos en comercios, turismo y servicios para vos y tu familia.", icon: CheckCircle },
            ].map(({ title, desc, icon: Icon }) => (
              <StaggerItem key={title} className="flex flex-col gap-4 px-8 py-6 first:pl-0 last:pr-0 group">
                <Icon className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="font-black text-slate-900 mb-1">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </ScrollReveal>

        </div>
      </section>

      {/* ── OBRAS SOCIALES ────────────────────────────────────── */}
      <section className="min-h-screen flex items-center py-16 bg-white">
        <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: Copy */}
            <ScrollReveal>
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4 block">
                Convenios
              </span>
              <TextReveal className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-tight mb-6">
                {obrasSociales.length}+ obras sociales{" "}
                <span className="text-slate-400">con convenio activo</span>
              </TextReveal>
              <p className="text-slate-500 leading-relaxed mb-10">
                Gestionamos aranceles y facturación centralizada con las principales prestadoras de salud de la provincia, para que te concentres en atender a tus pacientes.
              </p>
              <Link
                href="/obras-sociales"
                className="inline-flex items-center gap-1 text-slate-800 font-black hover:text-blue-600 transition-colors"
              >
                Ver todos los convenios <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </ScrollReveal>

            {/* Right: Names */}
            {obrasSociales.length > 0 && (
              <ScrollReveal variant="staggerContainer" className="flex flex-wrap gap-2">
                {obrasSociales.map((os) => (
                  <StaggerItem
                    key={os.id}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-medium hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    {os.nombre}
                  </StaggerItem>
                ))}
              </ScrollReveal>
            )}

          </div>
        </div>
      </section>

      {/* ── KINECLUB ──────────────────────────────────────────── */}
      {beneficiosFeatured.length > 0 && (
        <section className="py-28 md:py-40 bg-blue-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-800/30 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-900/30 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <ScrollReveal className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-4">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">
                  <Award className="h-4 w-4" /> KineClub Mendoza
                </span>
                <TextReveal className="text-3xl font-bold text-white">
                  Beneficios exclusivos para socios
                </TextReveal>
                <p className="text-blue-300 mt-2 text-sm">
                  {activeBeneficios.length} beneficios en comercios, turismo y servicios.
                </p>
              </div>
              <Link
                href="/kineclub"
                className="inline-flex items-center px-6 py-3 rounded-full bg-white text-blue-900 font-black shadow-md hover:bg-blue-50 transition-all shrink-0"
              >
                Explorar beneficios <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </ScrollReveal>
            <ScrollReveal variant="staggerContainer" className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {beneficiosFeatured.map((b) => (
                <StaggerItem
                  key={b.id}
                  className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {b.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.logo_url}
                        alt={b.empresa}
                        className="h-12 w-12 rounded-xl object-contain bg-white p-1 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-blue-800 flex items-center justify-center shrink-0">
                        <Award className="h-5 w-5 text-blue-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{b.empresa}</p>
                      {b.categoria && (
                        <p className="text-xs text-blue-400">{b.categoria.nombre}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-blue-200 text-sm leading-relaxed line-clamp-2">
                    {b.descripcion}
                  </p>
                  {b.descuento && (
                    <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-bold">
                      {b.descuento}
                    </div>
                  )}
                </StaggerItem>
              ))}
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── NOTICIAS + AGENDA ────────────────────────────────── */}
      {(ultimasNoticias.length > 0 || proximasCapacitaciones.length > 0) && (
        <section className="py-28 md:py-40 bg-white">
          <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-20">

              {/* Noticias */}
              {ultimasNoticias.length > 0 && (
                <div>
                  <ScrollReveal className="flex items-center justify-between mb-10">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-blue-600 mb-1 block">Novedades</span>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Últimas noticias</h2>
                    </div>
                    <Link href="/noticias" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">
                      Ver todas <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </ScrollReveal>
                  <ScrollReveal variant="staggerContainer" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ultimasNoticias.map((noticia) => (
                      <StaggerItem key={noticia.id}>
                        <Link
                          href={`/noticias?noticia=${noticia.slug}`}
                          className="group block rounded-2xl overflow-hidden border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white"
                        >
                          <div className="relative h-44 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
                            {noticia.imagen_url
                              ? <Image src={noticia.imagen_url} alt={noticia.titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                              : <div className="h-full w-full flex items-center justify-center"><Newspaper className="h-8 w-8 text-blue-200" /></div>
                            }
                          </div>
                          <div className="p-5">
                            {noticia.publicada_en && (
                              <p className="text-xs text-slate-400 mb-2">
                                {new Date(noticia.publicada_en).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                              </p>
                            )}
                            <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-3 group-hover:text-blue-600 transition-colors">
                              {noticia.titulo}
                            </h3>
                          </div>
                        </Link>
                      </StaggerItem>
                    ))}
                  </ScrollReveal>
                </div>
              )}

              {/* Divider */}
              {ultimasNoticias.length > 0 && proximasCapacitaciones.length > 0 && (
                <div className="h-px bg-slate-100" />
              )}

              {/* Agenda */}
              {proximasCapacitaciones.length > 0 && (
                <div>
                  <ScrollReveal className="flex items-center justify-between mb-10">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-blue-600 mb-1 block">Agenda</span>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Próximas capacitaciones</h2>
                    </div>
                  </ScrollReveal>
                  <ScrollReveal variant="staggerContainer" className="space-y-0">
                    {proximasCapacitaciones.map((cap) => {
                      const ModalidadIcon = MODALIDAD_ICON[cap.modalidad] ?? MapPin;
                      const fecha = new Date(cap.fechaInicio);
                      return (
                        <StaggerItem
                          key={cap.id}
                          className="group flex items-center gap-6 py-10 border-b border-slate-100 last:border-0"
                        >
                          {/* Gutter: línea a la izquierda, punto separado a la derecha */}
                          <div className="relative shrink-0 self-stretch w-8 flex items-center">
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white ring-2 ring-blue-300 group-hover:bg-blue-400 group-hover:ring-blue-400 z-10 transition-colors duration-200" />
                          </div>
                          {/* Fecha */}
                          <div className="shrink-0 text-center w-10">
                            <p className="text-xs font-black text-slate-400 uppercase leading-none">
                              {fecha.toLocaleDateString("es-AR", { month: "short" })}
                            </p>
                            <p className="text-2xl font-black text-slate-900 leading-tight">
                              {fecha.getDate()}
                            </p>
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TIPO_BADGE[cap.tipo] ?? "bg-slate-100 text-slate-700"}`}>
                                {cap.tipo}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                <ModalidadIcon className="h-3 w-3" /> {cap.modalidad}
                              </span>
                            </div>
                            <h3 className="font-black text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                              {cap.titulo}
                            </h3>
                          </div>
                        </StaggerItem>
                      );
                    })}
                  </ScrollReveal>
                  <p className="mt-6 text-xs text-slate-400">Asociate para acceder a la agenda completa e inscribirte.</p>
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="min-h-screen flex items-center py-16 bg-white border-t border-slate-100">
        <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fadeIn">
            <p className="text-blue-600 text-xs font-black uppercase tracking-widest mb-6">
              Portal del Socio
            </p>
            <TextReveal className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95] mb-10 max-w-4xl">
              Todo lo que necesitás,{" "}
              <span className="text-slate-400">en un sólo lugar.</span>
            </TextReveal>

            <CtaPills />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 text-blue-600 font-black text-lg hover:text-blue-500 transition-colors"
              >
                Solicitar admisión <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="text-slate-400 text-sm">Sin costo de inscripción · Revisión en 48hs</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
}
