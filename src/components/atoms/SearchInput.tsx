"use client";

import { Search, X, Loader2 } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useDebounce } from "use-debounce";

export default function SearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [text, setText] = useState(defaultValue);
  const [query] = useDebounce(text, 300);

  // Sincronizar el texto local si el defaultValue cambia (ej: al limpiar filtros)
  useEffect(() => {
    setText(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const currentQuery = params.get("q") || "";
    
    // Solo navegar si la query realmente cambió respecto a la URL actual
    if (query === currentQuery) return;

    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [query, pathname, router, searchParams]);

  // Cargando si hay una transición pendiente O si el texto escrito todavía no se reflejó en la query
  const isLoading = isPending || (text !== query);

  return (
    <div className="relative w-full max-w-2xl mx-auto group">
      <div className="absolute inset-0 bg-blue-500/20 rounded-[2rem] blur-2xl group-focus-within:bg-blue-500/30 transition-all duration-500 opacity-0 group-focus-within:opacity-100" />
      
      <div className="relative flex items-center">
        <Search className="absolute left-5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Buscá por nombre, apellido o matrícula..."
          className="w-full pl-14 pr-14 py-5 rounded-[2rem] bg-white shadow-xl shadow-blue-900/5 border border-slate-200/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-base font-medium"
        />
        <div className="absolute right-5 flex items-center space-x-2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : text ? (
            <button
              onClick={() => setText("")}
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
