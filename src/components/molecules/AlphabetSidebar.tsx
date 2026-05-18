"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
const SCROLL_AMOUNT = 160;

export default function AlphabetSidebar({ selectedChar = "" }: { selectedChar?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleLetterClick = (letter: string) => {
    const params = new URLSearchParams(searchParams);
    if (selectedChar === letter) {
      params.delete("char");
    } else {
      params.set("char", letter);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT, behavior: "smooth" });
  };

  return (
    <div className="w-full mb-8 flex items-center gap-2">
      <button
        onClick={() => scroll("left")}
        className="shrink-0 h-10 w-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-all"
        aria-label="Scroll izquierda"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className="flex items-center gap-2 min-w-max p-2">
          <button
            onClick={() => handleLetterClick("")}
            className={cn(
              "h-10 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
              !selectedChar
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-50 shadow-sm"
            )}
          >
            Todos
          </button>

          <div className="w-px h-6 bg-slate-200 mx-2" />

          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              disabled={isPending}
              className={cn(
                "h-10 w-10 shrink-0 rounded-2xl text-xs font-black transition-all",
                selectedChar === letter
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-50 shadow-sm",
                isPending && selectedChar === letter && "animate-pulse"
              )}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => scroll("right")}
        className="shrink-0 h-10 w-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-all"
        aria-label="Scroll derecha"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
