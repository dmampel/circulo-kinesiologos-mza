import { FileText, Scale, DollarSign, ClipboardList, ArrowUpRight } from "lucide-react";

// TODO: replace with real data
const PRESIDENTE = {
  nombre: "Lic. Nombre Apellido",
  cargo: "Presidente",
  iniciales: "NA",
};

// TODO: replace with real data
const COMISION_DIRECTIVA: Array<{ nombre: string; cargo: string; iniciales: string }> = [
  { nombre: "Lic. Nombre Apellido", cargo: "Vicepresidente/a", iniciales: "NA" },
  { nombre: "Lic. Nombre Apellido", cargo: "Secretario/a", iniciales: "NA" },
  { nombre: "Lic. Nombre Apellido", cargo: "Tesorero/a", iniciales: "NA" },
  { nombre: "Lic. Nombre Apellido", cargo: "1° Vocal Titular", iniciales: "NA" },
  { nombre: "Lic. Nombre Apellido", cargo: "2° Vocal Titular", iniciales: "NA" },
  { nombre: "Lic. Nombre Apellido", cargo: "Vocal Suplente", iniciales: "NA" },
];

// TODO: replace with real data
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

const DOCUMENTOS: Array<{ titulo: string; desc: string; href: string; icon: string }> = [
  {
    titulo: "Estatuto Institucional",
    desc: "Reglamento que rige la organización y funcionamiento del Círculo.",
    href: "/estatuto",
    icon: "FileText",
  },
  {
    titulo: "Código de Ética",
    desc: "Normas éticas que guían el ejercicio profesional de nuestros asociados.",
    href: "#",
    icon: "Scale",
  },
  {
    titulo: "Aranceles Vigentes",
    desc: "Tabla de aranceles negociados con obras sociales y prepagas.",
    href: "#",
    icon: "DollarSign",
  },
  {
    titulo: "Actas de Comisión",
    desc: "Registro de resoluciones y acuerdos de la comisión directiva.",
    href: "#",
    icon: "ClipboardList",
  },
];

// TODO: replace with real stats
const STATS = [
  { num: "65+", label: "Años de trayectoria" },
  { num: "500+", label: "Socios activos" },
  { num: "30+", label: "Obras sociales convenidas" },
];

const AVATAR_COLORS = [
  "bg-blue-600", "bg-slate-600", "bg-indigo-600",
  "bg-sky-600", "bg-blue-800", "bg-slate-500",
];

function DocumentIcon({ name }: { name: string }) {
  switch (name) {
    case "FileText":    return <FileText className="h-5 w-5" />;
    case "Scale":       return <Scale className="h-5 w-5" />;
    case "DollarSign":  return <DollarSign className="h-5 w-5" />;
    case "ClipboardList": return <ClipboardList className="h-5 w-5" />;
    default:            return <FileText className="h-5 w-5" />;
  }
}

export default function InstitucionalPage() {
  return (
    <div className="bg-white">

      {/* ── HERO — sin texto, pura atmósfera ── */}
      <section className="relative h-screen bg-slate-950 overflow-hidden">
        
        {/* Glows */}
        <div className="absolute top-1/4 left-1/3 w-[700px] h-[700px] bg-blue-600/20 rounded-full blur-[200px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[160px] pointer-events-none" />
        {/* Círculos concéntricos decorativos */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38vw] h-[38vw] rounded-full border border-white/[0.05]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[58vw] h-[58vw] rounded-full border border-white/[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[76vw] h-[76vw] rounded-full border border-white/[0.02]" />
       
        <div className="absolute bottom-16 md:bottom-20 left-0 right-0">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-none">
              El Círculo
            </p>
          </div>
        </div>
        {/* Línea inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />
      </section>

      {/* ── STATEMENT — tipografía a escala máxima ── */}
      <section className="bg-white py-24 md:py-40">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[0.88] mb-16 md:mb-24">
            Desde 1960,<br />
            <span className="text-blue-600">la voz</span><br />
            de los kinesiólogos<br />
            mendocinos.
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 leading-relaxed font-light max-w-3xl border-l-4 border-blue-600 pl-8">
            Negociamos convenios colectivos con obras sociales, mutuales y prepagas,
            representando a nuestros socios para asegurar aranceles justos. Generamos
            un espacio de pertenencia y colaboración, promoviendo la solidaridad, la
            formación continua y la difusión de la kinesiología en la sociedad.
          </p>
        </div>
      </section>

      {/* ── STATS — números que hablan ── */}
      <section className="border-y border-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center px-4 md:px-10">
                <p className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">{stat.num}</p>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mt-3 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISIÓN + VISIÓN — split full-bleed, sin contenedor ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-slate-950 py-24 md:py-36 px-8 md:px-16 xl:px-24">
          <span className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] block mb-10">
            Misión
          </span>
          <p className="text-xl md:text-2xl text-white/65 leading-[1.7] font-light">
            Negociamos convenios colectivos con obras sociales, mutuales y prepagas
            en representación de nuestros socios, buscando siempre mejorar los aranceles.
            Fomentamos un crecimiento conjunto basado en la solidaridad y la formación continua,
            y trabajamos en la concientización sobre el intrusismo profesional.
          </p>
        </div>
        <div className="bg-blue-600 py-24 md:py-36 px-8 md:px-16 xl:px-24">
          <span className="text-xs font-black text-blue-200 uppercase tracking-[0.3em] block mb-10">
            Visión
          </span>
          <p className="text-xl md:text-2xl text-white/85 leading-[1.7] font-light">
            Prestar servicios modernos y procedimientos sistematizados para atender de manera
            eficiente las necesidades de nuestros socios, adaptándonos a las demandas del sector
            con políticas de gestión de calidad.
          </p>
        </div>
      </section>

      {/* ── HISTORIA — años como elemento visual ── */}
      <section className="bg-white py-24 md:py-40">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-20">
            Historia
          </h2>
          {HITOS.map((hito, i) => (
            <div
              key={hito.año}
              className={`relative grid grid-cols-1 md:grid-cols-[9rem_1fr] gap-4 md:gap-16 py-14 overflow-hidden ${
                i < HITOS.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              {/* Año watermark */}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[6rem] md:text-[8rem] font-black text-slate-50 leading-none select-none pointer-events-none">
                {hito.año}
              </span>
              <span className="relative z-10 text-sm font-black text-blue-600 uppercase tracking-widest md:pt-1">
                {hito.año}
              </span>
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">
                  {hito.titulo}
                </h3>
                <p className="text-slate-500 leading-relaxed">{hito.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMISIÓN DIRECTIVA — escala editorial ── */}
      <section className="bg-slate-950 py-24 md:py-40">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-20">
            Comisión Directiva
          </h2>

          {/* Presidente — tipografía masiva */}
          <div className="pb-16 mb-2 border-b border-slate-800">
            <span className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] block mb-10">
              Presidencia
            </span>
            <div className="flex flex-col md:flex-row items-start md:items-end gap-8 md:gap-12">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-[2rem] bg-blue-600 flex items-center justify-center text-4xl font-black text-white shrink-0">
                {PRESIDENTE.iniciales}
              </div>
              <p className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-none">
                {PRESIDENTE.nombre}
              </p>
            </div>
          </div>

          {/* Resto de la comisión */}
          <div>
            {COMISION_DIRECTIVA.map((miembro, i) => (
              <div
                key={i}
                className={`flex items-center gap-6 py-7 ${
                  i < COMISION_DIRECTIVA.length - 1 ? "border-b border-slate-800/40" : ""
                }`}
              >
                <div
                  className={`h-11 w-11 rounded-xl ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-sm font-black text-white shrink-0`}
                >
                  {miembro.iniciales}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">
                    {miembro.cargo}
                  </span>
                  <p className="text-white font-semibold">{miembro.nombre}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOCUMENTOS — lista con flechas, sin cards ── */}
      <section className="bg-white py-24 md:py-40">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-16">
            Documentos Institucionales
          </h2>
          <div>
            {DOCUMENTOS.map((doc, i) => (
              <a
                key={doc.titulo}
                href={doc.href}
                className={`flex items-center gap-6 py-8 group ${
                  i < DOCUMENTOS.length - 1 ? "border-b border-slate-100" : ""
                }`}
              >
                <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-300 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shrink-0">
                  <DocumentIcon name={doc.icon} />
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
      <section className="bg-slate-50 pt-24 md:pt-40 pb-0">
        <div className="mx-auto w-[80%] pb-16 md:pb-20">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-16">
            Contacto y Ubicación
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <div className="pb-10 md:pb-0 md:pr-10">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Dirección</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tighter">
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
                className="text-2xl md:text-3xl font-black text-slate-900 hover:text-blue-600 transition-colors duration-200 tracking-tighter"
              >
                +54 9 261 3619468
              </a>
            </div>
          </div>
        </div>

        {/* Mapa full-bleed */}
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
