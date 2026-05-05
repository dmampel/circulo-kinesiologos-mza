"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ShieldCheck, Users, Award, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-100 text-blue-700 mb-6">
                Institución Centenaria
              </span>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                Excelencia en <span className="text-blue-600">Kinesiología</span> para Mendoza
              </h1>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-xl">
                Representamos y acompañamos a los profesionales de la salud kinésica, garantizando la calidad prestacional y el desarrollo continuo de nuestra disciplina.
              </p>

              {/* Quick Search Redirect */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/profesionales"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  Buscar Profesional <Search className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/registro"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-slate-900 border-2 border-slate-100 font-bold hover:bg-slate-50 transition-all"
                >
                  Asociate Ahora <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  <span className="text-slate-900 font-bold">+250</span> profesionales registrados
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="aspect-square rounded-3xl bg-slate-100 overflow-hidden relative shadow-2xl">
                {/* Aquí iría una imagen generada o placeholder premium */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent" />
                <div className="flex items-center justify-center h-full text-slate-300">
                  <ShieldCheck className="h-48 w-48 opacity-20" />
                </div>
              </div>
              
              {/* Floating stats card */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-50">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Award className="text-green-600 h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Convenios</p>
                    <p className="text-xl font-black text-slate-900">+40 Obras Sociales</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Servicios Institucionales</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Brindamos herramientas y beneficios exclusivos para potenciar el ejercicio profesional de nuestros asociados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Gestión de Convenios",
                desc: "Acceso simplificado a las principales obras sociales y prepagas con facturación centralizada.",
                icon: ShieldCheck,
                color: "blue",
                link: "/obras-sociales"
              },
              {
                title: "Comunidad Kinésica",
                desc: "Padrón público geolocalizado para facilitar la llegada de nuevos pacientes a tu consultorio.",
                icon: Users,
                color: "green",
                link: "/profesionales"
              },
              {
                title: "KineClub Mendoza",
                desc: "Beneficios exclusivos en comercios, turismo y capacitación para vos y tu familia.",
                icon: Award,
                color: "purple",
                link: "/kineclub"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group"
              >
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-colors",
                  feature.color === "blue" ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" :
                  feature.color === "green" ? "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white" :
                  "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                )}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  {feature.desc}
                </p>
                <Link href={feature.link} className="inline-flex items-center text-sm font-bold text-slate-900 hover:text-blue-600">
                  Saber más <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-[3rem] p-12 lg:p-20 relative overflow-hidden shadow-2xl shadow-blue-300 text-center lg:text-left">
            <div className="relative z-10 lg:flex items-center justify-between">
              <div className="lg:max-w-2xl mb-10 lg:mb-0">
                <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6">
                  ¿Sos profesional y querés sumarte?
                </h2>
                <p className="text-blue-100 text-lg">
                  Unite al Círculo y accedé a todos los beneficios, capacitaciones y la red prestacional más grande de la provincia.
                </p>
              </div>
              <Link
                href="/registro"
                className="inline-flex items-center px-10 py-5 rounded-2xl bg-white text-blue-600 font-black text-lg hover:bg-blue-50 transition-all"
              >
                Solicitar Admisión
              </Link>
            </div>
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full -ml-32 -mb-32 blur-3xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
