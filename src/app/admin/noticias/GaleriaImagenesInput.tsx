"use client";

import { useCallback, useRef, useState } from "react";
import { Reorder } from "framer-motion";
import {
  ImagePlus,
  Loader2,
  X,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
} from "lucide-react";
import { subirImagenNoticia } from "./actions";

const MAX_IMAGENES = 10;

type GaleriaItemEstado = "listo" | "subiendo" | "error";

interface GaleriaItem {
  id: string;
  url: string;
  alt: string;
  estado: GaleriaItemEstado;
  errorMsg?: string;
}

interface GaleriaImagenesInputProps {
  name: string;
  defaultValue?: { url: string; alt?: string | null }[];
}

function idLocal(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Átomo: badge que marca la imagen que se usa en listados y al compartir.
function BadgePortada() {
  return (
    <span className="absolute top-2 left-2 z-10 rounded-full bg-blue-600/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg">
      Portada
    </span>
  );
}

export default function GaleriaImagenesInput({ name, defaultValue = [] }: GaleriaImagenesInputProps) {
  const [items, setItems] = useState<GaleriaItem[]>(() =>
    defaultValue.map((img) => ({
      id: idLocal(),
      url: img.url,
      alt: img.alt ?? "",
      estado: "listo" as const,
    }))
  );
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const espacioDisponible = Math.max(MAX_IMAGENES - items.length, 0);

  const jsonValue = JSON.stringify(
    items
      .filter((item) => item.estado === "listo")
      .map((item) => ({ url: item.url, alt: item.alt || null }))
  );

  const subirArchivos = useCallback(
    async (files: FileList | File[]) => {
      const lista = Array.from(files).slice(0, espacioDisponible);
      // Subida secuencial: un archivo por request (design.md §3), cada ítem
      // entra con su propio estado sin descartar a los demás si uno falla.
      for (const file of lista) {
        const itemId = idLocal();
        setItems((prev) => [...prev, { id: itemId, url: "", alt: "", estado: "subiendo" }]);

        const formData = new FormData();
        formData.append("file", file);
        const result = await subirImagenNoticia(formData);

        setItems((prev) =>
          prev.map((item) =>
            item.id !== itemId
              ? item
              : result.success && result.url
                ? { ...item, url: result.url, estado: "listo" as const }
                : {
                    ...item,
                    estado: "error" as const,
                    errorMsg: result.error || "No se pudo subir la imagen.",
                  }
          )
        );
      }
    },
    [espacioDisponible]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      subirArchivos(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      subirArchivos(e.dataTransfer.files);
    }
  };

  const agregarPorUrl = () => {
    const url = urlInput.trim();
    if (!url || items.length >= MAX_IMAGENES) return;
    setItems((prev) => [...prev, { id: idLocal(), url, alt: "", estado: "listo" }]);
    setUrlInput("");
  };

  const quitarItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const actualizarAlt = (id: string, alt: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, alt } : item)));
  };

  const moverItem = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={jsonValue} />

      {/* Molécula: drop zone + file picker múltiple */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50/60"
            : "border-slate-200 hover:border-blue-400 bg-slate-50"
        }`}
      >
        <ImagePlus className="h-8 w-8 text-slate-300" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Arrastrá imágenes o hacé click para elegir
        </p>
        <p className="text-[10px] text-slate-400 font-medium">
          JPEG, PNG, WEBP o AVIF · hasta 4 MB · {espacioDisponible} de {MAX_IMAGENES} disponibles
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Agregar por URL: compatibilidad con noticias que usan imágenes externas */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="O pegá una URL (Unsplash, etc.)"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-xs font-bold"
          />
        </div>
        <button
          type="button"
          onClick={agregarPorUrl}
          disabled={!urlInput.trim() || items.length >= MAX_IMAGENES}
          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40 transition-all hover:bg-slate-700"
        >
          Agregar
        </button>
      </div>

      {/* Galería */}
      {items.length === 0 ? (
        <div className="aspect-video rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
          <ImagePlus className="h-10 w-10 mb-2" />
          <span className="text-[10px] font-black uppercase tracking-widest">Sin imágenes todavía</span>
        </div>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="grid grid-cols-2 gap-3">
          {items.map((item, index) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className="rounded-3xl border-2 border-dashed border-slate-200 bg-white overflow-hidden hover:border-blue-400 transition-all cursor-grab active:cursor-grabbing"
            >
              {/* Molécula: miniatura + estado + controles */}
              <div className="relative aspect-video bg-slate-50 group">
                {index === 0 && item.estado === "listo" && <BadgePortada />}

                {item.estado === "subiendo" && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-md">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Subiendo...
                    </span>
                  </div>
                )}

                {item.estado === "error" && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-red-50/95 backdrop-blur-md p-3 text-center">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    <span className="text-[9px] font-bold text-red-600 leading-tight">{item.errorMsg}</span>
                  </div>
                )}

                {item.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.alt || "Vista previa"}
                    className="h-full w-full object-cover"
                  />
                )}

                <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => moverItem(index, -1)}
                      disabled={index === 0}
                      aria-label="Mover a la izquierda"
                      className="h-7 w-7 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-slate-700 disabled:opacity-30 hover:bg-white transition-all"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => moverItem(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label="Mover a la derecha"
                      className="h-7 w-7 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-slate-700 disabled:opacity-30 hover:bg-white transition-all"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => quitarItem(item.id)}
                    aria-label="Quitar imagen"
                    className="h-7 w-7 rounded-full bg-red-500/90 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-600 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Alt: input chico bajo cada miniatura (design.md §5) */}
              <div className="p-2">
                <input
                  type="text"
                  value={item.alt}
                  onChange={(e) => actualizarAlt(item.id, e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  maxLength={200}
                  placeholder="Texto alternativo (opcional)"
                  className="w-full rounded-lg bg-slate-50 border border-transparent px-2 py-1.5 text-[10px] font-bold text-slate-600 focus:bg-white focus:border-blue-400 outline-none transition-all"
                />
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
