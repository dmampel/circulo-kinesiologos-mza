import type { Metadata } from "next";
import {
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { ObraSocialRepository } from "@/lib/repositories/ObraSocialRepository";
import ObrasSocialesGrid from "./ObrasSocialesGrid";

export const metadata: Metadata = {
  title: "Obras Sociales | Círculo de Kinesiólogos de Mendoza",
  description: "Consultá qué obras sociales y prepagas trabajan con kinesiólogos del Círculo de Mendoza. Información actualizada de convenios.",
  openGraph: {
    title: "Obras Sociales | CKM Mendoza",
    description: "Obras sociales y prepagas con convenio con el Círculo de Kinesiólogos de Mendoza.",
    url: "https://www.circulokinesiologos.com.ar/obras-sociales",
  },
};

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ObrasSocialesPage() {
  const obrasSociales = await ObraSocialRepository.getAllActive();

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
        <ObrasSocialesGrid obrasSociales={obrasSociales} />

        {/* Aviso para Profesionales */}
        <div className="mt-20 py-16 border-t border-slate-100">
          <p className="text-blue-600 text-xs font-black uppercase tracking-widest mb-6">
            Atención Profesionales
          </p>
          <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-[0.95] mb-6 max-w-3xl">
            ¿Dudas sobre facturación{" "}
            <span className="text-slate-400">o convenios?</span>
          </h2>
          <p className="text-slate-500 leading-relaxed mb-10 max-w-xl">
            Recordá que podés descargar los instructivos de facturación
            actualizados desde el panel privado de socios.
          </p>
          <div className="flex flex-col items-end gap-1">
            <Link
              href="/mi-panel"
              className="inline-flex items-center gap-2 text-blue-600 font-black text-lg hover:text-blue-500 transition-colors"
            >
              Ir a mi Panel <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="text-slate-400 text-sm">Exclusivo para socios activos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
