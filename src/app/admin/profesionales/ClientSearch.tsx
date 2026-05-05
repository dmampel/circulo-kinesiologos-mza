"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export default function ClientSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
      <Search className="ml-2 h-4 w-4 text-slate-400" />
      <input 
        type="text" 
        placeholder="Buscar por nombre, apellido o matrícula..." 
        defaultValue={searchParams.get("q")?.toString()}
        onChange={(e) => handleSearch(e.target.value)}
        className="bg-transparent border-none focus:ring-0 text-sm font-medium pr-4 w-72 outline-none"
      />
    </div>
  );
}
