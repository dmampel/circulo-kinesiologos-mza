"use client";

import { useState } from "react";
import { CheckCircle2, Wallet, MessageCircle, Mail, X, Clock } from "lucide-react";
import { inscribirseACapacitacion } from "@/app/mi-panel/capacitaciones/actions";

interface BotonInscripcionProps {
  profesionalId: string;
  capacitacionId: string;
  costo: number | null;
  titulo: string;
  estadoInscripcion: string | null;
}

export default function BotonInscripcion({
  profesionalId,
  capacitacionId,
  costo,
  titulo,
  estadoInscripcion,
}: BotonInscripcionProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const esPago = costo !== null && costo > 0;

  const handleInscripcion = async () => {
    setLoading(true);
    try {
      await inscribirseACapacitacion(profesionalId, capacitacionId);
      if (esPago) {
        setShowModal(true);
      }
    } catch (error) {
      console.error(error);
      alert("Hubo un error al procesar tu inscripción.");
    } finally {
      setLoading(false);
    }
  };

  const cbu = process.env.NEXT_PUBLIC_CBU ?? "";
  const alias = process.env.NEXT_PUBLIC_ALIAS ?? "";
  const titular = process.env.NEXT_PUBLIC_TITULAR ?? "";
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
  const pagosEmail = process.env.NEXT_PUBLIC_PAGOS_EMAIL ?? "";

  const whatsappMessage = `Hola, envío el comprobante de pago para la capacitación "${titulo}". Mi matrícula es: `;
  const emailSubject = `Comprobante de Pago - ${titulo}`;

  const estaInscripto = estadoInscripcion === "CONFIRMADA" || (estadoInscripcion === "PENDIENTE" && !esPago);
  const estaPendientePago = estadoInscripcion === "PENDIENTE" && esPago;

  return (
    <>
      {estaInscripto ? (
        <div className="bg-green-50 text-green-600 font-bold p-3 rounded-xl text-center text-sm border border-green-100 flex items-center justify-center">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Ya estás inscripto
        </div>
      ) : estaPendientePago ? (
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold p-3 rounded-xl transition-all border border-orange-200 text-sm flex items-center justify-center cursor-pointer"
        >
          <Clock className="mr-2 h-4 w-4" /> Pendiente de Pago
        </button>
      ) : (
        <button
          onClick={handleInscripcion}
          disabled={loading}
          className="w-full cursor-pointer flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl transition-all shadow-md shadow-blue-200 disabled:opacity-50"
        >
          {loading ? (
            "Procesando..."
          ) : (
            <>
              {esPago ? <Wallet className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {esPago ? "Inscribirme" : "Inscribirme"}
            </>
          )}
        </button>
      )}

      {/* Modal de Pago */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 flex items-center">
                <Wallet className="mr-2 h-5 w-5 text-blue-600" /> Datos de Transferencia
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-900 bg-white rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-500 mb-1">Monto a transferir</p>
                <p className="text-3xl font-black text-green-600">${costo?.toLocaleString()}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alias</p>
                  <p className="font-bold text-slate-900 select-all">{alias}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">CBU</p>
                  <p className="font-bold text-slate-900 select-all">{cbu}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Titular</p>
                  <p className="font-bold text-slate-900">{titular}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 text-center">
                  Una vez hecha la transferencia, envíanos el comprobante indicando tu matrícula:
                </p>
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center p-3 rounded-xl bg-green-50 text-green-600 font-bold hover:bg-green-100 transition-colors border border-green-200"
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> Enviar por WhatsApp
                </a>
                <a
                  href={`mailto:${pagosEmail}?subject=${encodeURIComponent(emailSubject)}`}
                  className="w-full flex items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <Mail className="mr-2 h-4 w-4" /> Enviar por Email
                </a>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 text-center">
              <button 
                onClick={() => setShowModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Cerrar y enviar más tarde
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
