"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface Props {
  localidades: { id: string; nombre: string }[];
}

export default function LocalidadFilter({ localidades }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("loc", value);
    } else {
      params.delete("loc");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative">
      <select
        defaultValue={searchParams.get("loc") ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none bg-white border border-slate-100 rounded-2xl pl-4 pr-9 py-2.5 text-sm font-medium text-slate-600 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer"
      >
        <option value="">Todas las localidades</option>
        {localidades.map((loc) => (
          <option key={loc.id} value={loc.id}>{loc.nombre}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    </div>
  );
}
