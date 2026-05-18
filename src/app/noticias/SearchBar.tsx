"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("busqueda") ?? "");
  const [isPending, startTransition] = useTransition();

  const submit = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term.trim()) {
      params.set("busqueda", term.trim());
    } else {
      params.delete("busqueda");
    }
    params.delete("pagina");
    startTransition(() => router.push(`/noticias?${params.toString()}`, { scroll: false }));
  };

  const clear = () => {
    setValue("");
    submit("");
  };

  return (
    <div className={`relative flex items-center justify-end transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit(value)}
        placeholder="Buscar noticias..."
        className="pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-56 transition-all focus:w-72"
      />
      {value && (
        <button onClick={clear} className="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
