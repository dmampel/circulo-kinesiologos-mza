"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, MapPin, Award } from "lucide-react";

interface Props {
  name: string;
  defaultValue: string;
  options: { id: string; nombre: string }[];
  placeholder: string;
  icon?: "loc" | "spec";
}

export default function FilterSelect({ name, defaultValue, options, placeholder, icon }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentValue = searchParams.get(name) || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const IconComponent = icon === "loc" ? MapPin : icon === "spec" ? Award : null;

  return (
    <div className="relative group">
      {IconComponent && (
        <IconComponent className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none z-10" />
      )}
      <select
        name={name}
        value={currentValue}
        onChange={handleChange}
        className={cn(
          "w-full pl-11 pr-10 py-4 rounded-2xl bg-white border border-slate-200 shadow-lg shadow-blue-900/5 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm font-medium appearance-none cursor-pointer",
          isPending && "opacity-50 cursor-wait"
        )}
      >
        <option value="" className="bg-white text-slate-900">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id} className="bg-white text-slate-900">
            {opt.nombre}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
}
