"use client";

import { useState } from "react";
import { Mail, Phone, FileText, Loader2, AlertCircle, MessageCircle } from "lucide-react";
import { revelarContacto } from "@/app/bolsa-de-trabajo/actions";

type RevelarContactoResult = Awaited<ReturnType<typeof revelarContacto>>;
type Tipo = "busco-trabajo" | "busco-kinesiologo";
type Estado = "idle" | "cargando" | "revelado" | "error";

/**
 * Único componente cliente de las tarjetas de listado (`design.md — D8`).
 * Estados: idle → cargando → revelado (`mailto:`, `wa.me`, descarga de CV) →
 * error. El contacto nunca viaja en el HTML inicial: sólo llega acá, al
 * click, por la Server Action `revelarContacto` (`design.md — D2/D3`).
 */
export default function BotonContactar({ tipo, id }: { tipo: Tipo; id: string }) {
  const [estado, setEstado] = useState<Estado>("idle");
  const [resultado, setResultado] = useState<RevelarContactoResult | null>(null);

  async function handleClick() {
    setEstado("cargando");
    try {
      const res = await revelarContacto(tipo, id);
      setResultado(res);
      setEstado(res.success ? "revelado" : "error");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "revelado" && resultado?.success) {
    const { contacto } = resultado;

    if (contacto.tipo === "busco-trabajo") {
      const whatsapp = `https://wa.me/${contacto.telefono.replace(/[^0-9]/g, "")}`;
      return (
        <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
          <a
            href={`mailto:${contacto.email}`}
            className="flex items-center px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
          >
            <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
          </a>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3 py-2 rounded-xl bg-green-50 text-green-600 text-xs font-bold hover:bg-green-600 hover:text-white transition-all"
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> {contacto.telefono}
          </a>
          {contacto.cvUrl ? (
            <a
              href={contacto.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-all"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" /> Ver CV
            </a>
          ) : (
            <span className="flex items-center px-3 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs font-bold">
              <FileText className="h-3.5 w-3.5 mr-1.5" /> CV no disponible
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="animate-in fade-in duration-300 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5">
        <Phone className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-blue-700 break-words">{contacto.medioContacto}</p>
      </div>
    );
  }

  if (estado === "error") {
    const mensaje = resultado && !resultado.success ? resultado.error : "No se pudo obtener el contacto.";
    return (
      <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
        <AlertCircle className="h-4 w-4 shrink-0" /> {mensaje}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={estado === "cargando"}
      className="w-full flex items-center justify-center px-6 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-60 shadow-sm shadow-blue-100"
    >
      {estado === "cargando" ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Phone className="h-4 w-4 mr-2" />
      )}
      {estado === "cargando" ? "Cargando..." : "Contactar"}
    </button>
  );
}
