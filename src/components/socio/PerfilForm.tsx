"use client";

import { useActionState, useRef, useState } from "react";
import { updateDatosContacto, updateFotoPerfil } from "@/app/mi-panel/perfil/actions";
import { Phone, MessageCircle, MapPin, Clock, Camera, CheckCircle, AlertCircle, User, CreditCard } from "lucide-react";
import Image from "next/image";

type ActionResult = { success: true } | { success: false; error: string } | null;

interface PerfilFormProps {
  profesional: {
    nombre: string;
    apellido: string;
    matricula: string;
    telefono: string | null;
    whatsapp: string | null;
    direccion: string | null;
    horarios: string | null;
    foto_url: string | null;
  };
}

function Feedback({ state }: { state: ActionResult }) {
  if (!state) return null;
  if (state.success) {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
        <CheckCircle className="h-4 w-4 shrink-0" />
        Cambios guardados correctamente.
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {state.error}
    </div>
  );
}

export default function PerfilForm({ profesional }: PerfilFormProps) {
  const [contactState, contactAction, contactPending] = useActionState(
    updateDatosContacto,
    null
  );
  const [fotoState, fotoAction, fotoPending] = useActionState(
    updateFotoPerfil,
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profesional.foto_url);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-10">
      {/* ── Datos de solo lectura ── */}
      <section className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">
          Datos Institucionales
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: User, label: "Nombre", value: profesional.nombre },
            { icon: User, label: "Apellido", value: profesional.apellido },
            { icon: CreditCard, label: "Matrícula", value: `M.P. ${profesional.matricula}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="h-9 w-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-4 italic">
          Para modificar datos institucionales, contactá a administración.
        </p>
      </section>

      {/* ── Foto de perfil ── */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-6">Foto de Perfil</h2>
        <form action={fotoAction} className="flex flex-col sm:flex-row items-start gap-6">
          {/* Preview */}
          <div
            className="relative h-28 w-28 rounded-[1.5rem] overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Foto de perfil"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-300">
                <span className="text-4xl font-black">
                  {profesional.nombre[0]}{profesional.apellido[0]}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Upload controls */}
          <div className="flex-1 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              name="foto"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Camera className="h-4 w-4" />
              Elegir imagen
            </button>
            <p className="text-[10px] text-slate-400">
              JPG, PNG o WebP · Máximo 2 MB
            </p>
            <Feedback state={fotoState} />
            <button
              type="submit"
              disabled={fotoPending}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {fotoPending ? "Subiendo…" : "Guardar foto"}
            </button>
          </div>
        </form>
      </section>

      <div className="border-t border-slate-100" />

      {/* ── Datos de contacto ── */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-6">Datos de Contacto</h2>
        <form action={contactAction} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { name: "telefono", label: "Teléfono", icon: Phone, placeholder: "Ej: 261 4000000", defaultValue: profesional.telefono },
              { name: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "Ej: 261 4000000", defaultValue: profesional.whatsapp },
            ].map(({ name, label, icon: Icon, placeholder, defaultValue }) => (
              <div key={name} className="space-y-1.5">
                <label htmlFor={name} className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type="text"
                  placeholder={placeholder}
                  defaultValue={defaultValue ?? ""}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="direccion" className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <MapPin className="h-3.5 w-3.5" />
              Dirección del Consultorio
            </label>
            <input
              id="direccion"
              name="direccion"
              type="text"
              placeholder="Ej: Av. San Martín 1234, Mendoza"
              defaultValue={profesional.direccion ?? ""}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="horarios" className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Clock className="h-3.5 w-3.5" />
              Horarios de Atención
            </label>
            <textarea
              id="horarios"
              name="horarios"
              rows={3}
              placeholder="Ej: Lun a Vie 9:00 – 18:00"
              defaultValue={profesional.horarios ?? ""}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
            />
          </div>

          <Feedback state={contactState} />

          <button
            type="submit"
            disabled={contactPending}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {contactPending ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </section>
    </div>
  );
}
