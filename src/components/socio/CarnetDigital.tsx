"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import CarnetQR from "@/components/socio/CarnetQR";

interface Props {
  profesional: any; // Usamos any por las relaciones o definimos el tipo extendido
  slug: string;
}

export default function CarnetDigital({ profesional, slug }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full aspect-[1.6/1] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-500/20 group"
    >
      {/* Fondo Base con Gradiente Profundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900" />
      
      {/* Capas Decorativas / Glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500 rounded-full blur-[80px] opacity-40 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[60px] opacity-30" />

      {/* Marca de Agua / Textura */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
        <span className="text-[20rem] font-black tracking-tighter rotate-12">CKM</span>
      </div>

      {/* Contenido Principal (Glass Layer) */}
      <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
        {/* Header del Carnet */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-blue-700 font-black text-xl">CK</span>
            </div>
            <div>
              <h2 className="text-white font-black text-lg tracking-tighter leading-none">
                Círculo de <br /> Kinesiólogos
              </h2>
              <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mt-1">
                Mendoza, Argentina
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-green-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-wider">Habilitado</span>
            </div>
            <p className="text-white/40 text-[9px] font-medium mt-2 tracking-widest uppercase">
              Vigencia 2026
            </p>
          </div>
        </div>

        {/* Info del Profesional */}
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-6">
            {/* Foto o Iniciales */}
            <div className="h-28 w-28 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 p-1.5 overflow-hidden shadow-xl">
              <div className="h-full w-full rounded-[1.6rem] bg-white/5 flex items-center justify-center text-white overflow-hidden">
                {profesional.foto_url ? (
                  <img 
                    src={profesional.foto_url} 
                    alt={profesional.nombre} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-black opacity-40">
                    {profesional.nombre[0]}{profesional.apellido[0]}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">
                Profesional Colegiado
              </p>
              <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tighter leading-none uppercase">
                {profesional.apellido} <br />
                <span className="text-white/80">{profesional.nombre}</span>
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="px-2 py-0.5 bg-blue-500 rounded text-[10px] font-black text-white">
                  M.P. {profesional.matricula}
                </div>
                {profesional.especialidades?.[0] && (
                  <span className="text-white/50 text-[10px] font-bold truncate max-w-[120px]">
                    {profesional.especialidades[0].nombre}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* QR Code (real — apunta al perfil público) */}
          <div className="h-16 w-16 bg-white rounded-2xl p-2 shadow-xl group-hover:scale-105 transition-transform duration-500">
            <div className="h-full w-full rounded-lg flex items-center justify-center bg-slate-800">
              <CarnetQR slug={slug} />
            </div>
          </div>
        </div>
      </div>

      {/* Borde sutil exterior */}
      <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 pointer-events-none" />
    </motion.div>
  );
}
