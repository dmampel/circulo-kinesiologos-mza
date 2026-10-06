"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Newspaper, X } from "lucide-react";

interface ImagenNoticia {
  url: string;
  alt: string | null;
}

interface CarruselNoticiaProps {
  imagenes: ImagenNoticia[];
  titulo: string;
}

const SWIPE_VELOCITY_THRESHOLD = 400;
const SWIPE_OFFSET_THRESHOLD = 60;

export default function CarruselNoticia({ imagenes, titulo }: CarruselNoticiaProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Un swipe del carrusel no debe abrir la imagen ampliada
  const arrastrando = useRef(false);

  const ampliar = () => {
    if (arrastrando.current) return;
    dialogRef.current?.showModal();
  };

  // Imagen entera a pantalla completa. <dialog> nativo: Esc cierra solo.
  const lightbox = (imagen: ImagenNoticia) => (
    <dialog
      ref={dialogRef}
      onClick={() => dialogRef.current?.close()}
      className="m-0 h-dvh w-screen max-h-none max-w-none bg-transparent p-0 backdrop:bg-slate-950/90"
    >
      <div className="relative h-full w-full">
        <Image src={imagen.url} alt={imagen.alt || titulo} fill sizes="100vw" className="object-contain p-4" />
      </div>
      <button
        type="button"
        aria-label="Cerrar imagen"
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-700"
      >
        <X className="h-5 w-5" />
      </button>
    </dialog>
  );

  // Placeholder: sin imágenes (comportamiento actual conservado)
  if (imagenes.length === 0) {
    return (
      <div className="aspect-video bg-slate-100 flex items-center justify-center">
        <Newspaper className="h-12 w-12 text-slate-300" />
      </div>
    );
  }

  // Imagen estática: comportamiento idéntico al actual, sin controles
  if (imagenes.length === 1) {
    const imagen = imagenes[0];
    return (
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <button type="button" onClick={ampliar} aria-label="Ver imagen completa" className="absolute inset-0 cursor-zoom-in">
          <Image
            src={imagen.url}
            alt={imagen.alt || titulo}
            fill
            priority
            className="object-cover"
          />
        </button>
        {lightbox(imagen)}
      </div>
    );
  }

  const total = imagenes.length;
  const irA = (nuevoIndex: number) => {
    if (nuevoIndex === index) return;
    setDirection(nuevoIndex > index ? 1 : -1);
    setIndex(nuevoIndex);
  };

  const anterior = () => {
    if (index === 0) return;
    irA(index - 1);
  };

  const siguiente = () => {
    if (index === total - 1) return;
    irA(index + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      anterior();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      siguiente();
    } else if (e.key === "Enter") {
      e.preventDefault();
      ampliar();
    }
  };

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const { offset, velocity } = info;
    if (offset.x > SWIPE_OFFSET_THRESHOLD || velocity.x > SWIPE_VELOCITY_THRESHOLD) {
      anterior();
    } else if (offset.x < -SWIPE_OFFSET_THRESHOLD || velocity.x < -SWIPE_VELOCITY_THRESHOLD) {
      siguiente();
    }
  };

  const actual = imagenes[index];

  return (
    <div
      className="relative aspect-video overflow-hidden bg-slate-100 outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-roledescription="carrusel"
      aria-label={`Imágenes de ${titulo}`}
    >
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={index}
          custom={direction}
          initial={{ x: direction >= 0 ? "100%" : "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction >= 0 ? "-100%" : "100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => { arrastrando.current = true; }}
          onDragEnd={(e, info) => {
            handleDragEnd(e, info);
            setTimeout(() => { arrastrando.current = false; }, 0);
          }}
          onClick={ampliar}
          className="absolute inset-0 cursor-zoom-in"
        >
          <Image
            src={actual.url}
            alt={actual.alt || titulo}
            fill
            priority={index === 0}
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
      {lightbox(actual)}

      {/* Flechas prev/next — glassmorphism */}
      <button
        type="button"
        onClick={anterior}
        disabled={index === 0}
        aria-label="Imagen anterior"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/70 backdrop-blur-md shadow-lg flex items-center justify-center text-slate-700 hover:bg-white disabled:opacity-0 disabled:pointer-events-none transition-all"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={siguiente}
        disabled={index === total - 1}
        aria-label="Imagen siguiente"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/70 backdrop-blur-md shadow-lg flex items-center justify-center text-slate-700 hover:bg-white disabled:opacity-0 disabled:pointer-events-none transition-all"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Contador */}
      <div className="absolute top-4 right-4 z-10 rounded-full bg-white/70 backdrop-blur-md px-3 py-1 text-xs font-black text-slate-700 shadow-lg">
        {index + 1} / {total}
      </div>

      {/* Indicadores */}
      <div className="absolute bottom-4 inset-x-0 z-10 flex items-center justify-center gap-1.5">
        {imagenes.map((imagen, i) => (
          <button
            key={imagen.url + i}
            type="button"
            onClick={() => irA(i)}
            aria-label={`Ir a la imagen ${i + 1}`}
            className={`h-1.5 rounded-full backdrop-blur-md transition-all ${
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
