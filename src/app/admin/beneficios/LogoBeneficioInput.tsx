"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import SafeLogoImage from "@/components/atoms/SafeLogoImage";
import { ALLOWED_LOGO_MIME_TYPES, validarLogo } from "@/lib/validations/beneficio";

interface Props {
  /** Logo guardado actualmente (sólo en edición). */
  logoActual?: string | null;
  /** Muestra la opción "Quitar logo" (sólo en edición). */
  permitirQuitar?: boolean;
}

const inputClass =
  "w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold";

export default function LogoBeneficioInput({ logoActual = null, permitirQuitar = false }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewArchivo, setPreviewArchivo] = useState<string | null>(null);
  const [urlPegada, setUrlPegada] = useState("");
  const [quitar, setQuitar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoca el object URL al cambiar o desmontar.
  useEffect(() => {
    return () => {
      if (previewArchivo) URL.revokeObjectURL(previewArchivo);
    };
  }, [previewArchivo]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreviewArchivo(null);
      setError(null);
      return;
    }
    const errorLogo = validarLogo(file);
    if (errorLogo) {
      setError(errorLogo);
      setPreviewArchivo(null);
      e.target.value = ""; // no se envía un archivo inválido
      return;
    }
    setError(null);
    setPreviewArchivo(URL.createObjectURL(file));
  };

  const urlValida = urlPegada.startsWith("https://") ? urlPegada : null;
  const preview = previewArchivo ?? urlValida ?? (quitar ? null : logoActual);

  return (
    <div className="space-y-4">
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
        Logo de la Empresa (Opcional)
      </label>

      <div className="flex flex-col sm:flex-row gap-4">
        <label className="flex-1 flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center cursor-pointer transition-all hover:border-blue-400">
          <ImagePlus className="h-8 w-8 text-slate-300" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            Hacé click para elegir el logo
          </span>
          <span className="text-[0.625rem] text-slate-400 font-medium">PNG, JPEG, WEBP o AVIF · hasta 2 MB</span>
          <input
            ref={fileRef}
            type="file"
            name="logo"
            accept={ALLOWED_LOGO_MIME_TYPES.join(",")}
            onChange={handleFile}
            className="sr-only"
          />
        </label>

        <div className="h-40 w-full sm:w-40 shrink-0 rounded-3xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
          {preview ? (
            <SafeLogoImage
              key={preview}
              src={preview}
              alt="Vista previa del logo"
              className="h-full w-full object-contain p-4"
              fallback={
                <span className="px-2 text-center text-[0.625rem] font-black uppercase tracking-widest text-slate-300">
                  No se pudo cargar la imagen
                </span>
              }
            />
          ) : (
            <span className="text-[0.625rem] font-black uppercase tracking-widest text-slate-300">Vista Previa</span>
          )}
        </div>
      </div>

      {error && <p className="text-xs font-bold text-red-600 ml-1">{error}</p>}

      <div className="space-y-2">
        <input
          name="logo_url_externa"
          type="url"
          value={urlPegada}
          onChange={(e) => setUrlPegada(e.target.value)}
          className={inputClass}
          placeholder="o pegá una URL (https://...)"
        />
        <p className="text-[0.6875rem] text-slate-400 font-medium ml-1">
          Los links externos pueden dejar de funcionar (los de Instagram, Facebook o WhatsApp vencen en días).
          Recomendamos subir el archivo.
        </p>
      </div>

      {permitirQuitar && logoActual && (
        <label className="inline-flex items-center gap-2 ml-1 text-xs font-black uppercase tracking-widest text-slate-500 cursor-pointer">
          <input
            type="checkbox"
            name="quitar_logo"
            checked={quitar}
            onChange={(e) => setQuitar(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <Trash2 className="h-4 w-4" /> Quitar logo
        </label>
      )}
    </div>
  );
}
