"use client";

import { useState, useRef } from "react";
import { QrCode, X, Download, ArrowUpRight } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ckmendoza.com.ar";

interface QRModalProps {
  slug: string;
  nombre: string;
  matricula: string;
}

export default function QRModal({ slug, nombre, matricula }: QRModalProps) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const url = `${BASE_URL}/profesionales/${slug}`;

  function handleDownload() {
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-ckm-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group w-full text-left"
      >
        <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
          <QrCode className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900">Generar QR</p>
          <p className="text-[11px] text-slate-400 font-medium">Tu credencial digital y código QR</p>
        </div>
        <ArrowUpRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-blue-600 transition-colors" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl shadow-slate-900/20 flex flex-col items-center gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.25em]">Credencial Digital</p>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{nombre}</h2>
                <p className="text-xs text-slate-400 font-medium">M.P. {matricula}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={canvasRef} className="p-4 bg-slate-900 rounded-2xl">
              <QRCodeCanvas
                value={url}
                size={200}
                bgColor="#0f172a"
                fgColor="#ffffff"
                level="M"
              />
            </div>

            <p className="text-[11px] text-slate-400 font-medium text-center leading-relaxed">
              Mostrá este código para acreditar tu condición de socio activo del Círculo de Kinesiólogos.
            </p>

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors"
            >
              <Download className="h-4 w-4" />
              Descargar QR
            </button>
          </div>
        </div>
      )}
    </>
  );
}
