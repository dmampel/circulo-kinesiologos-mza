"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface AdminSearchProps {
  placeholder?: string;
}

export default function AdminSearch({ placeholder = "Buscar..." }: AdminSearchProps) {
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
    <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
      <Search className="ml-2 h-4 w-4 text-slate-400 shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        defaultValue={searchParams.get("q")?.toString()}
        onChange={(e) => handleSearch(e.target.value)}
        className="bg-transparent border-none focus:ring-0 text-sm font-medium pr-4 outline-none w-52"
      />
    </div>
  );
}
