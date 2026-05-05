"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  totalPages: number;
  currentPage: number;
}

export default function Pagination({ totalPages, currentPage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (totalPages <= 1) return null;

  // Generar array de páginas para mostrar
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Lógica para mostrar solo algunas páginas si hay muchas (opcional, pero buena práctica)
  const visiblePages = pages.filter(p => 
    p === 1 || 
    p === totalPages || 
    (p >= currentPage - 1 && p <= currentPage + 1)
  );

  return (
    <div className="flex items-center justify-center space-x-2 mt-16">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center space-x-2">
        {pages.map((page, index) => {
          // Mostrar el separador de "..."
          const showEllipsis = index > 0 && page - pages[index - 1] > 1;
          
          return (
            <div key={page} className="flex items-center space-x-2">
              {showEllipsis && <span className="text-slate-400 font-bold px-2">...</span>}
              <button
                onClick={() => handlePageChange(page)}
                className={cn(
                  "h-12 w-12 rounded-2xl text-sm font-black transition-all",
                  currentPage === page
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                )}
              >
                {page}
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
