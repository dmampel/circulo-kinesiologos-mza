"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Texto recortado a 3 líneas con "Ver más / Ver menos". Es cliente porque la
 * única forma de saber si el texto realmente se corta es medirlo en pantalla:
 * si entra en las 3 líneas, no se muestra el botón.
 */
export default function TextoExpandible({ texto, className = "" }: { texto: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [desborda, setDesborda] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || abierto) return;
    const medir = () => setDesborda(el.scrollHeight > el.clientHeight + 1);
    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(el);
    return () => observer.disconnect();
  }, [abierto]);

  return (
    <div className={className}>
      <p
        ref={ref}
        className={`text-sm text-slate-500 leading-relaxed whitespace-pre-line ${abierto ? "" : "line-clamp-3"}`}
      >
        {texto}
      </p>
      {desborda && (
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          aria-expanded={abierto}
          className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-700 mt-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {abierto ? "Ver menos" : "Ver más"}
        </button>
      )}
    </div>
  );
}
