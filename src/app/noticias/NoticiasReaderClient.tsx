"use client";

import { useRouter } from "next/navigation";

interface Categoria {
  id: string;
  nombre: string;
  slug: string;
}

interface Props {
  categorias: Categoria[];
  activeCategoria: string | null;
}

export default function CategoriaFilter({ categorias, activeCategoria }: Props) {
  const router = useRouter();

  const nav = (slug: string | null) => {
    const params = new URLSearchParams();
    if (slug) params.set("categoria", slug);
    router.push(`/noticias${params.size ? `?${params}` : ""}`, { scroll: false });
  };

  const items = [
    { id: "todas", nombre: "Todas", slug: null as string | null },
    ...categorias.map(c => ({ ...c, slug: c.slug as string | null })),
  ];

  return (
    <div className="flex items-center gap-0 overflow-x-auto border-b border-slate-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((cat) => {
        const isActive = cat.slug === null ? !activeCategoria : activeCategoria === cat.slug;
        return (
          <button
            key={cat.id}
            onClick={() => nav(cat.slug)}
            className={`px-4 py-2.5 text-[11px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            {cat.nombre}
          </button>
        );
      })}
    </div>
  );
}
