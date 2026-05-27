import type { Metadata } from "next";
import { FileText, ArrowUpRight } from "lucide-react";
import { AutoridadRepository } from "@/lib/repositories/AutoridadRepository";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { ObraSocialRepository } from "@/lib/repositories/ObraSocialRepository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Institucional | Círculo de Kinesiólogos de Mendoza",
  description: "Conocé la historia, misión y autoridades del Círculo de Kinesiólogos de Mendoza. Institución que representa y agrupa a los profesionales de la kinesiología mendocina.",
  openGraph: {
    title: "Institucional | CKM Mendoza",
    description: "Historia, misión y Comisión Directiva del Círculo de Kinesiólogos de Mendoza.",
    url: "https://www.circulokinesiologos.com.ar/institucional",
  },
};

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

const HITOS: Array<{ año: string; titulo: string; desc: string }> = [
  {
    año: "1960",
    titulo: "Fundación",
    desc: "Se fundó el Círculo de Kinesiólogos y Fisioterapeutas de Mendoza como organización gremial provincial.",
  },
  {
    año: "1975",
    titulo: "Primeros Convenios",
    desc: "Se firmaron los primeros convenios colectivos con obras sociales provinciales, estableciendo aranceles dignos.",
  },
  {
    año: "1990",
    titulo: "Sede Institucional",
    desc: "Inauguración de la sede actual en Eusebio Blanco 148, Capital, consolidando la presencia institucional.",
  },
  {
    año: "2005",
    titulo: "Formación Continua",
    desc: "Lanzamiento del programa de capacitación profesional con becas y descuentos exclusivos para socios.",
  },
  {
    año: "2020",
    titulo: "Transformación Digital",
    desc: "Modernización de servicios y canales de comunicación para una gestión más eficiente con los socios.",
  },
];

const DOCUMENTOS: Array<{ titulo: string; desc: string; href: string }> = [
  {
    titulo: "Estatuto Institucional",
    desc: "Reglamento que rige la organización y funcionamiento del Círculo.",
    href: "/estatuto.pdf",
  },
];


const AVATAR_COLORS = [
  "bg-blue-600", "bg-slate-600", "bg-indigo-600",
  "bg-sky-600", "bg-blue-800", "bg-slate-500",
];


export default async function InstitucionalPage() {
  const [autoridades, sociosCount, obrasSocialesCount] = await Promise.all([
    AutoridadRepository.findAll(),
    ProfesionalRepository.countActive(),
    ObraSocialRepository.countActive(),
  ]);

  const STATS = [
    { num: "65+", label: "Años de trayectoria" },
    { num: `${sociosCount}+`, label: "Socios activos" },
    { num: `${obrasSocialesCount}+`, label: "Obras sociales convenidas" },
  ];
  
  const presidente = autoridades.find(a => a.cargo.toLowerCase() === 'presidente');
  const restoComision = autoridades.filter(a => a.cargo.toLowerCase() !== 'presidente');

  return (
    <div className="bg-white">

      {/* ── HERO ── */}
      <section className="relative h-screen bg-slate-950 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[700px] h-[700px] bg-blue-600/20 rounded-full blur-[200px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38vw] h-[38vw] rounded-full border border-white/[0.05]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[58vw] h-[58vw] rounded-full border border-white/[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[76vw] h-[76vw] rounded-full border border-white/[0.02]" />
       
        <div className="absolute bottom-16 md:bottom-20 left-0 right-0">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-6xl md:text-7xl xl:text-8xl 2xl:text-9xl font-black text-white tracking-tighter leading-none">
              El Círculo
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />
      </section>

      {/* ── STATEMENT ── */}
      <section className="bg-white py-16 md:py-20 xl:py-28 2xl:py-40">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="text-4xl md:text-5xl xl:text-6xl 2xl:text-8xl font-black text-slate-900 tracking-tighter leading-[0.88] mb-10 md:mb-14 2xl:mb-24">
            Desde 1960,<br />
            <span className="text-blue-600">la voz</span><br />
            de los kinesiólogos<br />
            mendocinos.
          </h1>
          <p className="text-base md:text-lg xl:text-xl 2xl:text-2xl text-slate-500 leading-relaxed font-light max-w-3xl border-l-4 border-blue-600 pl-8">
            Negociamos convenios colectivos con obras sociales, mutuales y prepagas,
            representando a nuestros socios para asegurar aranceles justos. Generamos
            un espacio de pertenencia y colaboración, promoviendo la solidaridad, la
            formación continua y la difusión de la kinesiología en la sociedad.
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-10 md:py-14 xl:py-16">
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center px-4 md:px-10">
                <p className="text-3xl md:text-4xl xl:text-5xl 2xl:text-6xl font-black text-slate-900 tracking-tighter">{stat.num}</p>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mt-3 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISIÓN + VISIÓN ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-slate-950 py-14 md:py-20 xl:py-24 2xl:py-36 px-8 md:px-14 xl:px-16 2xl:px-24">
          <span className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] block mb-7 xl:mb-10">
            Misión
          </span>
          <p className="text-base md:text-lg xl:text-xl 2xl:text-2xl text-white/65 leading-[1.7] font-light">
            Negociamos convenios colectivos con obras sociales, mutuales y prepagas
            en representación de nuestros socios, buscando siempre mejorar los aranceles.
            Fomentamos un crecimiento conjunto basado en la solidaridad y la formación continua,
            y trabajamos en la concientización sobre el intrusismo profesional.
          </p>
        </div>
        <div className="bg-blue-600 py-14 md:py-20 xl:py-24 2xl:py-36 px-8 md:px-14 xl:px-16 2xl:px-24">
          <span className="text-xs font-black text-blue-200 uppercase tracking-[0.3em] block mb-7 xl:mb-10">
            Visión
          </span>
          <p className="text-base md:text-lg xl:text-xl 2xl:text-2xl text-white/85 leading-[1.7] font-light">
            Prestar servicios modernos y procedimientos sistematizados para atender de manera
            eficiente las necesidades de nuestros socios, adaptándonos a las demandas del sector
            con políticas de gestión de calidad.
          </p>
        </div>
      </section>

      {/* ── HISTORIA ── */}
      <section className="bg-white py-14 md:py-20 xl:py-28 2xl:py-40">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 xl:mb-16">
            Historia
          </h2>
          {HITOS.map((hito, i) => (
            <div
              key={hito.año}
              className={`relative grid grid-cols-1 md:grid-cols-[9rem_1fr] gap-4 md:gap-16 py-9 xl:py-12 overflow-hidden ${
                i < HITOS.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[6rem] md:text-[8rem] font-black text-slate-50 leading-none select-none pointer-events-none">
                {hito.año}
              </span>
              <span className="relative z-10 text-sm font-black text-blue-600 uppercase tracking-widest md:pt-1">
                {hito.año}
              </span>
              <div className="relative z-10">
                <h3 className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-black text-slate-900 mb-3 tracking-tight">
                  {hito.titulo}
                </h3>
                <p className="text-slate-500 leading-relaxed">{hito.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMISIÓN DIRECTIVA ── */}
      <section className="bg-slate-950 py-14 md:py-20 xl:py-28 2xl:py-40">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10 xl:mb-16">
            Comisión Directiva
          </h2>

          {/* Presidente */}
          {presidente && (
            <div className="pb-10 xl:pb-14 mb-2 border-b border-slate-800">
              <span className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] block mb-7 xl:mb-10">
                Presidencia
              </span>
              <div className="flex flex-col md:flex-row items-start md:items-end gap-8 md:gap-12">
                <div className="h-24 w-24 md:h-28 md:w-28 2xl:h-32 2xl:w-32 rounded-[2rem] bg-blue-600 flex items-center justify-center text-4xl font-black text-white shrink-0 overflow-hidden">
                  {presidente.profesional.foto_url ? (
                    <img
                      src={presidente.profesional.foto_url}
                      alt={presidente.profesional.full_name || ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(presidente.profesional.nombre, presidente.profesional.apellido)
                  )}
                </div>
                <p className="text-3xl md:text-4xl xl:text-5xl 2xl:text-7xl font-black text-white tracking-tighter leading-none">
                  {presidente.profesional.full_name || `${presidente.profesional.nombre} ${presidente.profesional.apellido}`}
                </p>
              </div>
            </div>
          )}

          {/* Resto de la comisión */}
          <div>
            {restoComision.map((miembro, i) => (
              <div
                key={miembro.id}
                className={`flex items-center gap-6 py-7 ${
                  i < restoComision.length - 1 ? "border-b border-slate-800/40" : ""
                }`}
              >
                <div
                  className={`h-11 w-11 rounded-xl ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-sm font-black text-white shrink-0 overflow-hidden`}
                >
                  {miembro.profesional.foto_url ? (
                    <img 
                      src={miembro.profesional.foto_url} 
                      alt={miembro.profesional.full_name || ""} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(miembro.profesional.nombre, miembro.profesional.apellido)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">
                    {miembro.cargo}
                  </span>
                  <p className="text-white font-semibold">
                    {miembro.profesional.full_name || `${miembro.profesional.nombre} ${miembro.profesional.apellido}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {autoridades.length === 0 && (
            <p className="text-slate-500 text-center py-20 italic">
              Información de la comisión directiva en proceso de actualización.
            </p>
          )}
        </div>
      </section>

      {/* ── DOCUMENTOS ── */}
      <section className="bg-white py-14 md:py-20 xl:py-28 2xl:py-40">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-9 xl:mb-14">
            Documentos Institucionales
          </h2>
          <div>
            {DOCUMENTOS.map((doc) => (
              <a
                key={doc.titulo}
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-6 py-8 group"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-300 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-xl text-slate-900 mb-1 group-hover:text-blue-600 transition-colors duration-200">
                    {doc.titulo}
                  </p>
                  <p className="text-sm text-slate-400">{doc.desc}</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-200 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACTO + MAPA ── */}
      <section className="bg-slate-50 pt-14 md:pt-20 xl:pt-28 2xl:pt-40 pb-0">
        <div className="mx-auto w-[80%] pb-10 md:pb-14 xl:pb-18">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-9 xl:mb-14">
            Contacto y Ubicación
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <div className="pb-10 md:pb-0 md:pr-10">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Dirección</p>
              <p className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-black text-slate-900 leading-tight tracking-tighter">
                Eusebio Blanco 148
              </p>
              <p className="text-slate-500 mt-2">Capital, Mendoza</p>
            </div>
            <div className="py-10 md:py-0 md:px-10">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Email</p>
              <a
                href="mailto:presidencia@kinesiologosmza.com"
                className="text-base md:text-lg font-bold text-blue-600 hover:underline underline-offset-4 break-all"
              >
                presidencia@kinesiologosmza.com
              </a>
            </div>
            <div className="pt-10 md:pt-0 md:pl-10">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Teléfono</p>
              <a
                href="tel:+5492613619468"
                className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-black text-slate-900 hover:text-blue-600 transition-colors duration-200 tracking-tighter"
              >
                +54 9 261 3619468
              </a>
            </div>
          </div>
        </div>

        <div className="w-full h-[28rem] md:h-[36rem]">
          <iframe
            src="https://maps.google.com/maps?q=Eusebio+Blanco+148%2C+Capital%2C+Mendoza%2C+Argentina&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0, display: "block" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación del Círculo de Kinesiólogos de Mendoza"
          />
        </div>
      </section>

    </div>
  );
}
