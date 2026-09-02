"use client";

import { Search, X, Loader2 } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useDebounce } from "use-debounce";

export default function SearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [text, setText] = useState(defaultValue);
  const [query] = useDebounce(text, 300);

  // El input solo escribe en la URL si el cambio lo hizo el usuario.
  // Si el cambio viene de afuera (Limpiar, back/forward), manda la URL.
  const [editando, setEditando] = useState(false);

  // Queries que navegamos nosotros: cuando el server nos las devuelve como
  // defaultValue son un eco propio, no un cambio externo.
  const navegadas = useRef<string[]>([]);

  // Leemos los params más frescos sin que el efecto dependa de ellos: así una
  // navegación ajena no puede re-disparar una query vieja del debounce.
  const paramsRef = useRef(searchParams);
  useEffect(() => {
    paramsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    const eco = navegadas.current.indexOf(defaultValue);
    if (eco !== -1) {
      // Es el eco de una navegación nuestra: no pisamos lo que el usuario tipeó.
      navegadas.current = navegadas.current.slice(eco + 1);
      return;
    }

    navegadas.current = [];
    setEditando(false);
    setText(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!editando) return;

    const params = new URLSearchParams(paramsRef.current);
    if ((params.get("q") || "") === query) return;

    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    params.delete("page");

    navegadas.current.push(query);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [query, editando, pathname, router]);

  const handleChange = (value: string) => {
    setEditando(true);
    setText(value);
  };

  // Cargando si hay una transición pendiente O si lo que el usuario escribió
  // todavía no se reflejó en la query debounceada.
  const isLoading = isPending || (editando && text !== query);

  return (
    <div className="relative w-full max-w-2xl mx-auto group">
      <div className="absolute inset-0 bg-blue-500/20 rounded-[2rem] blur-2xl group-focus-within:bg-blue-500/30 transition-all duration-500 opacity-0 group-focus-within:opacity-100" />

      <div className="relative flex items-center">
        <Search className="absolute left-5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
        <input
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Buscá por nombre, apellido o matrícula..."
          className="w-full pl-14 pr-14 py-5 rounded-[2rem] bg-white shadow-xl shadow-blue-900/5 border border-slate-200/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-base font-medium"
        />
        <div className="absolute right-5 flex items-center space-x-2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : text ? (
            <button
              onClick={() => handleChange("")}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
