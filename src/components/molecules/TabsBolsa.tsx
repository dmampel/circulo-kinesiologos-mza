import Link from "next/link";
import { cn } from "@/lib/utils";
import { Briefcase, Building2 } from "lucide-react";

type Tipo = "busco-trabajo" | "busco-kinesiologo";

/**
 * Cambio de pestaña por `Link` con `?tipo=` (`design.md — D8`). Sin JS: es un
 * Server Component. Cambiar de pestaña resetea el resto de los filtros a
 * propósito — un `loc`/`spec` de un listado no siempre es válido en el otro.
 */
export default function TabsBolsa({ basePath, tipo }: { basePath: string; tipo: Tipo }) {
  const tabs: { tipo: Tipo; label: string; icon: typeof Briefcase }[] = [
    { tipo: "busco-trabajo", label: "Busco trabajo", icon: Briefcase },
    { tipo: "busco-kinesiologo", label: "Busco kinesiólogo", icon: Building2 },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5">
      {tabs.map(({ tipo: t, label, icon: Icon }) => (
        <Link
          key={t}
          href={`${basePath}?tipo=${t}`}
          className={cn(
            "flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all",
            tipo === t
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
    </div>
  );
}
