import {
  Search,
  ShieldCheck,
  FileText,
  ExternalLink,
  Info,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ObrasSocialesPage() {
  const obrasSociales = await prisma.obraSocial.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
  });

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 pt-24 pb-64 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-black tracking-widest uppercase mb-8">
            <ShieldCheck className="mr-2 h-4 w-4" /> Convenios Activos
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-white mb-8 tracking-tighter">
            Obras Sociales <br />{" "}
            <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">
              con Convenio
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Trabajamos con las principales prepagas y obras sociales para
            garantizar el acceso a la salud kinésica de calidad en toda la
            provincia.
          </p>

          {/* Buscador de Obras Sociales */}
          <div className="mt-12 relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar obra social o prepaga..."
              className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white/20 transition-all text-sm font-medium backdrop-blur-md"
            />
          </div>
        </div>

        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-600 rounded-full blur-[150px]" />
        </div>

        {/* Onda Inferior Irregular y Pronunciada */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 transform translate-y-[1px]">
          <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            className="relative block w-full h-32 sm:h-64 text-slate-50 fill-current"
          >
            <path d="M0,160L80,149.3C160,139,320,117,480,128C640,139,800,181,960,192C1120,203,1280,181,1360,170.7L1440,160L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z" />
          </svg>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-48 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {obrasSociales.length === 0 ? (
            <div className="col-span-full text-center py-20 text-slate-500 font-bold">
              Aún no hay obras sociales cargadas en el sistema.
            </div>
          ) : (
            obrasSociales.map((os) => (
              <div
                key={os.id}
                className="bg-white/60 backdrop-blur-2xl p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col h-full"
              >
                <div className="h-24 w-full rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-blue-50/50 transition-colors overflow-hidden border border-slate-100 p-4">
                  {os.logo_url ? (
                    <img
                      src={os.logo_url}
                      alt={os.nombre}
                      className="h-full w-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <ShieldCheck className="h-10 w-10 text-slate-300 group-hover:text-blue-400 transition-colors" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex-grow">
                  {os.nombre}
                </h3>
                <div className="flex items-center text-[10px] font-black text-green-600 uppercase tracking-wider mb-6 mt-auto">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                  Convenio Activo
                </div>

                <div className="flex items-center space-x-2 mt-auto">
                  {os.convenio_url ? (
                    <a
                      href={os.convenio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center py-2.5 rounded-xl bg-slate-50 text-slate-900 text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                      <FileText className="mr-2 h-4 w-4" /> Vademécum
                    </a>
                  ) : (
                    <span className="flex-1 inline-flex items-center justify-center py-2.5 rounded-xl bg-slate-50 text-slate-400 text-xs font-bold">
                      Sin PDF adjunto
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Aviso para Profesionales */}
        <div className="mt-20 bg-slate-900 rounded-[3rem] p-10 lg:p-16 text-white relative overflow-hidden">
          <div className="relative z-10 lg:flex items-center justify-between gap-12">
            <div className="max-w-2xl mb-8 lg:mb-0">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600 text-[10px] font-black tracking-widest uppercase mb-6">
                Atención Profesionales
              </div>
              <h2 className="text-3xl font-bold mb-4">
                ¿Dudas sobre facturación o convenios?
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Recordá que podés descargar los instructivos de facturación
                actualizados desde el panel privado de socios.
              </p>
            </div>
            <Link
              href="/mi-panel"
              className="inline-flex items-center px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold hover:bg-blue-50 transition-all whitespace-nowrap"
            >
              Ir a mi Panel <ExternalLink className="ml-2 h-5 w-5" />
            </Link>
          </div>
          {/* Decorative pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        </div>
      </div>
    </div>
  );
}
