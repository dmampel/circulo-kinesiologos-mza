"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { ShieldCheck, Copy, Check, MessageCircle, Mail } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ckmendoza.com.ar";

interface Profesional {
  nombre: string;
  apellido: string;
  matricula: string;
  slug: string;
  foto_url: string | null;
  especialidades: { nombre: string }[];
}

interface Props {
  profesional: Profesional;
}

export default function CarnetFlip({ profesional }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const url = `${BASE_URL}/profesionales/${profesional.slug}`;

  function handleFlip() {
    setFlipping(true);
    setFlipped((v) => !v);
    setTimeout(() => setFlipping(false), 700);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (flipped || flipping) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tiltX = ((y - rect.height / 2) / (rect.height / 2)) * -8;
    const tiltY = ((x - rect.width / 2) / (rect.width / 2)) * 8;
    setTilt({ x: tiltX, y: tiltY });
    setMousePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setMousePos({ x: 50, y: 50 });
  }

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cardTransform = flipped
    ? "perspective(1200px) rotateY(180deg)"
    : `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`;

  const cardTransition = flipping
    ? "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)"
    : "transform 0.12s ease-out";

  return (
    <div className="space-y-6">
      {/* Card container */}
      <div
        ref={cardRef}
        className="relative w-full cursor-pointer select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleFlip}
      >
        {/* Rotating card */}
        <div
          className="relative w-full"
          style={{
            transform: cardTransform,
            transition: cardTransition,
            transformStyle: "preserve-3d",
          }}
        >
          {/* ── FRENTE ── */}
          <div
            className="relative w-full aspect-[1.6/1] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-500/20"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900" />
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500 rounded-full blur-[80px] opacity-40" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[60px] opacity-30" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
              <span className="text-[20rem] font-black tracking-tighter rotate-12">CKM</span>
            </div>

            {/* Holographic */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[2.5rem]"
              style={{
                background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.14) 0%, rgba(130,0,255,0.09) 30%, rgba(0,200,255,0.09) 60%, transparent 80%)`,
                mixBlendMode: "overlay",
              }}
            />

            <div className="absolute inset-0 p-5 sm:p-8 flex flex-col justify-between z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
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
                <div className="flex flex-col items-end gap-2">
                  <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-green-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Habilitado</span>
                  </div>
                  <p className="text-white/40 text-[9px] font-medium tracking-widest uppercase">Vigencia 2026</p>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-[1.5rem] sm:rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 p-1.5 overflow-hidden shadow-xl shrink-0">
                    <div className="relative h-full w-full rounded-[1.2rem] sm:rounded-[1.6rem] bg-white/5 flex items-center justify-center overflow-hidden">
                      {profesional.foto_url ? (
                        <Image src={profesional.foto_url} alt={profesional.nombre} fill className="object-cover" />
                      ) : (
                        <span className="text-4xl font-black text-white opacity-40">
                          {profesional.nombre[0]}{profesional.apellido[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Profesional Colegiado</p>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tighter leading-none uppercase">
                      {profesional.apellido} <br />
                      <span className="text-white/80">{profesional.nombre}</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="px-2 py-0.5 bg-blue-500 rounded text-[10px] font-black text-white shrink-0">
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

                <div className="h-16 w-16 bg-white rounded-2xl p-2 shadow-xl shrink-0">
                  <div className="h-full w-full rounded-lg flex items-center justify-center bg-slate-800">
                    <QRCodeCanvas value={url} size={44} bgColor="#1e293b" fgColor="#ffffff" level="M" />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/20 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
              Tocá para girar
            </div>
            <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 pointer-events-none" />
          </div>

          {/* ── DORSO ── */}
          <div
            className="absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-500/20"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900" />
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-600 rounded-full blur-[80px] opacity-20" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
              <span className="text-[20rem] font-black tracking-tighter -rotate-12">CKM</span>
            </div>

            <div className="absolute inset-0 p-5 sm:p-8 flex flex-col items-center justify-between z-10">
              <div className="flex flex-col items-center gap-3">
                <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.3em]">Verificar Credencial</p>
                <div className="p-3 bg-white rounded-2xl shadow-xl">
                  <QRCodeCanvas value={url} size={140} bgColor="#ffffff" fgColor="#0f172a" level="M" />
                </div>
                <p className="text-white/25 text-[8px] font-medium text-center tracking-wide">
                  {BASE_URL.replace(/^https?:\/\//, "")}/profesionales/{profesional.slug}
                </p>
              </div>

              <div className="w-full flex items-end justify-between">
                <div>
                  <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold mb-0.5">Titular</p>
                  <p className="text-white font-black text-sm tracking-tight uppercase">
                    {profesional.apellido}, {profesional.nombre}
                  </p>
                  <p className="text-blue-400 text-[10px] font-bold">M.P. {profesional.matricula}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold mb-0.5">Emisor</p>
                  <p className="text-white/70 text-[10px] font-bold">Círculo de Kinesiólogos</p>
                  <p className="text-white/40 text-[9px]">Mendoza, Argentina</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/20 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
              Volver al frente
            </div>
            <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Compartir */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:border-blue-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-all"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "¡Copiado!" : "Copiar link"}
        </button>
        <a
          href={`https://wa.me/?text=Verificá%20mi%20credencial%20profesional%20en%20${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:border-green-300 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-green-600 transition-all"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
        <a
          href={`mailto:?subject=Mi%20credencial%20profesional&body=Verificá%20mi%20credencial%20en%20${encodeURIComponent(url)}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:border-blue-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-all"
        >
          <Mail className="h-3.5 w-3.5" />
          Mail
        </a>
      </div>
    </div>
  );
}
