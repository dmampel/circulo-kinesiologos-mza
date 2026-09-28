"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Upload, Loader2 } from "lucide-react";
import { crearAvisoBuscoTrabajo } from "@/app/bolsa-de-trabajo/actions";
import { HONEYPOT_FIELD, ALLOWED_CV_EXTENSIONS } from "@/lib/validations/bolsaDeTrabajo";

type ActionResult = Awaited<ReturnType<typeof crearAvisoBuscoTrabajo>>;

interface Props {
  localidades: { id: string; nombre: string }[];
  especialidades: { id: string; nombre: string }[];
}

const inputClass =
  "w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium outline-none";
const labelClass = "text-xs font-bold text-slate-400 uppercase ml-1";

/**
 * Formulario "Busco trabajo" (`design.md — D8`, `tasks.md — 4.7`). Único
 * componente cliente junto a `FormBuscoKinesiologo` y `BotonContactar`
 * (`4.14`). Envuelve `crearAvisoBuscoTrabajo` (que ya toma `FormData` directo)
 * para que encaje en `useActionState`, sin tocar la Server Action de los
 * grupos 1-3.
 */
export default function FormBuscoTrabajo({ localidades, especialidades }: Props) {
  const router = useRouter();
  const [aceptado, setAceptado] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => crearAvisoBuscoTrabajo(formData),
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
        <div className="space-y-2">
          <label className={labelClass}>Nombre *</label>
          <input name="nombre" required maxLength={100} className={inputClass} placeholder="Ej: Ana" />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Apellido *</label>
          <input name="apellido" required maxLength={100} className={inputClass} placeholder="Ej: García" />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Matrícula *</label>
          <input name="matricula" required maxLength={50} className={inputClass} placeholder="M.P. 1234" />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Teléfono / WhatsApp *</label>
          <input name="telefono" type="tel" required maxLength={30} className={inputClass} placeholder="+54 261 ..." />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className={labelClass}>Email *</label>
          <input name="email" type="email" required maxLength={200} className={inputClass} placeholder="vos@mail.com" />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Especialidad *</label>
          <select name="especialidadId" required className={inputClass}>
            <option value="">Seleccioná una especialidad</option>
            {especialidades.map((esp) => (
              <option key={esp.id} value={esp.id}>
                {esp.nombre}
              </option>
            ))}
          </select>
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
        <div className="space-y-2 md:col-span-2">
          <label className={labelClass}>Zona (opcional)</label>
          <input name="zona" maxLength={100} className={inputClass} placeholder="Ej: Gran Mendoza, zona oeste" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className={labelClass}>Disponibilidad *</label>
          <input
            name="disponibilidad"
            required
            maxLength={300}
            className={inputClass}
            placeholder="Ej: full time, turno mañana"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className={labelClass}>Presentación *</label>
          <textarea
            name="presentacion"
            required
            maxLength={2000}
            rows={5}
            className={`${inputClass} resize-none`}
            placeholder="Contanos brevemente tu perfil y experiencia."
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className={labelClass}>CV (opcional, PDF/DOC/DOCX, hasta 5 MB)</label>
          <label className="flex items-center gap-3 w-full px-6 py-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 cursor-pointer hover:border-blue-400 transition-all text-sm font-medium text-slate-500">
            <Upload className="h-4 w-4 shrink-0" />
            <input
              type="file"
              name="cv"
              accept={ALLOWED_CV_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
              className="text-sm w-full file:hidden"
            />
          </label>
        </div>
      </div>

      {/* Honeypot: oculto con CSS. Si un bot lo completa, la action responde
          éxito sin persistir nada (design.md — D9). */}
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
          Acepto que mis datos de contacto (teléfono, email y CV si lo adjunto) sean publicados y estén
          disponibles para quien consulte este aviso, bajo los términos de la aclaración legal de esta sección.
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
