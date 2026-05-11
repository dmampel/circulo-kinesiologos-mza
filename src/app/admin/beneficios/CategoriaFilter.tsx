"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface Props {
  categorias: { id: string; nombre: string }[];
}

export default function CategoriaFilter({ categorias }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("cat", value);
    } else {
      params.delete("cat");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative">
      <select
        defaultValue={searchParams.get("cat") ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-9 py-2.5 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer"
      >
        <option value="">Todas las categorías</option>
        {categorias.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    </div>
  );
}
