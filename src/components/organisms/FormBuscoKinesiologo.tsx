"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { crearAvisoBuscoKinesiologo } from "@/app/bolsa-de-trabajo/actions";
import { HONEYPOT_FIELD } from "@/lib/validations/bolsaDeTrabajo";

type ActionResult = Awaited<ReturnType<typeof crearAvisoBuscoKinesiologo>>;

interface Props {
  localidades: { id: string; nombre: string }[];
}

const inputClass =
  "w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium outline-none";
const labelClass = "text-xs font-bold text-slate-400 uppercase ml-1";

/**
 * Formulario "Busco kinesiólogo" (`design.md — D8`, `tasks.md — 4.8`). Mismo
 * patrón que `FormBuscoTrabajo`, sin adjunto y con `<input type="date">`
 * nativo para la fecha límite.
 */
export default function FormBuscoKinesiologo({ localidades }: Props) {
  const router = useRouter();
  const [aceptado, setAceptado] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => crearAvisoBuscoKinesiologo(formData),
    null,
  );

  useEffect(() => {
    if (state?.success) {
      router.push("/bolsa-de-trabajo/publicar/exito");
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-8">
      {state && !state.success && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm font-bold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" /> {state.error ?? "No se pudo publicar el aviso."}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className={labelClass}>Institución / consultorio / profesional *</label>
          <input name="institucion" required maxLength={150} className={inputClass} placeholder="Ej: Clínica San Martín" />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Localidad *</label>
          <select name="localidadId" required className={inputClass}>
            <option value="">Seleccioná una localidad</option>
            {localidades.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Zona (opcional)</label>
          <input name="zona" maxLength={100} className={inputClass} placeholder="Ej: Gran Mendoza, zona este" />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Área de trabajo *</label>
          <input name="area" required maxLength={150} className={inputClass} placeholder="Ej: Traumatología" />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Tipo de puesto *</label>
          <input name="tipoPuesto" required maxLength={150} className={inputClass} placeholder="Ej: Planta, suplencia" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className={labelClass}>Días y horarios *</label>
          <input name="diasHorarios" required maxLength={300} className={inputClass} placeholder="Ej: Lunes a viernes, turno tarde" />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Modalidad de contratación *</label>
          <input name="modalidad" required maxLength={150} className={inputClass} placeholder="Ej: Relación de dependencia" />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Fecha límite para postularse (opcional)</label>
          <input name="fechaLimite" type="date" className={inputClass} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className={labelClass}>Requisitos *</label>
          <textarea name="requisitos" required maxLength={2000} rows={4} className={`${inputClass} resize-none`} placeholder="Requisitos para el puesto." />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className={labelClass}>Propuesta *</label>
          <textarea name="propuesta" required maxLength={2000} rows={4} className={`${inputClass} resize-none`} placeholder="Contanos la propuesta económica y de trabajo." />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className={labelClass}>Medio de contacto *</label>
          <input
            name="medioContacto"
            required
            maxLength={200}
            className={inputClass}
            placeholder="Ej: institucion@mail.com o WhatsApp 261 ..."
          />
        </div>
      </div>

      <input
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <label className="flex items-start gap-3 rounded-2xl bg-blue-50/50 border border-blue-100 px-5 py-4 cursor-pointer">
        <input
          type="checkbox"
          name="aceptaDifusion"
          value="true"
          checked={aceptado}
          onChange={(e) => setAceptado(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded accent-blue-600"
        />
        <span className="text-xs font-medium text-slate-600 leading-relaxed">
          Acepto que el medio de contacto informado sea publicado y esté disponible para quien consulte este
          aviso, bajo los términos de la aclaración legal de esta sección.
        </span>
      </label>

      <button
        type="submit"
        disabled={!aceptado || pending}
        className="w-full md:w-auto flex items-center justify-center px-10 py-4 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
      >
        {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {pending ? "Publicando..." : "Publicar aviso"}
      </button>
    </form>
  );
}
