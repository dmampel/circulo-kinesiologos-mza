import { History, Target, Users, Award, ChevronRight, Scale } from "lucide-react";
import Link from "next/link";

export default function InstitucionalPage() {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Institucional */}
      <div className="bg-white border-b pt-24 pb-32">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 tracking-tighter">
            Nuestra <span className="text-blue-600">Institución</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Desde Mendoza, trabajamos por la jerarquización de la kinesiología y la protección de los derechos de nuestros profesionales asociados.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 mt-16 space-y-24">
        
        {/* Misión y Visión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-8">
              <Target className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Nuestra Misión</h2>
            <p className="text-slate-600 leading-relaxed">
              Agrupar a los profesionales kinesiólogos de la provincia de Mendoza, defendiendo sus intereses gremiales y propiciando su perfeccionamiento científico y ético constante.
            </p>
          </div>
          <div className="bg-slate-900 p-12 rounded-[3rem] shadow-xl text-white">
            <div className="h-14 w-14 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-8">
              <History className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black mb-6 tracking-tight">Nuestra Historia</h2>
            <p className="text-slate-400 leading-relaxed">
              Contamos con décadas de trayectoria institucional, siendo el pilar fundamental para el desarrollo de la kinesiología moderna en nuestra región y un nexo vital con el sistema de salud.
            </p>
          </div>
        </div>

        {/* Ejes de Gestión */}
        <div>
          <h2 className="text-center text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-16">Ejes de Nuestra Gestión</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: "Ética Profesional", desc: "Velamos por el cumplimiento de las normas éticas que rigen nuestra profesión.", icon: Scale },
              { title: "Defensa Gremial", desc: "Negociamos convenios y aranceles dignos para todos nuestros asociados.", icon: Award },
              { title: "Formación", desc: "Impulsamos el crecimiento científico a través de cursos y posgrados.", icon: Users },
            ].map((eje, i) => (
              <div key={i} className="text-center group">
                <div className="mx-auto h-20 w-20 rounded-[2rem] bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <eje.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">{eje.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{eje.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Institucional */}
        <div className="bg-blue-50 p-12 lg:p-20 rounded-[4rem] border border-blue-100 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-6">Autoridades y Estatuto</h2>
          <p className="text-slate-600 max-w-xl mx-auto mb-12">
            Podés consultar la conformación actual de nuestra comisión directiva y los reglamentos que rigen nuestra institución.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/autoridades" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center">
              Comisión Directiva <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/estatuto" className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center">
              Ver Estatuto <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
