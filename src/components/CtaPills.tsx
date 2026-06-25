"use client";

import { useState } from "react";
import { CreditCard, Newspaper, CalendarDays, UserCircle, ShieldCheck } from "lucide-react";

const pills = [
  {
    label: "Carnet Digital",
    icon: CreditCard,
    desc: "Llevá tu credencial siempre con vos. QR verificable y datos actualizados al instante.",
  },
  {
    label: "Circulares Internas",
    icon: Newspaper,
    desc: "Recibí comunicados oficiales del Círculo. Seguí qué ya leíste y qué tenés pendiente.",
  },
  {
    label: "Agenda de Capacitaciones",
    icon: CalendarDays,
    desc: "Inscribite a cursos, talleres y congresos directamente desde el portal.",
  },
  {
    label: "Perfil Profesional",
    icon: UserCircle,
    desc: "Tu ficha pública en el padrón: especialidades, contacto y zona de atención.",
  },
  {
    label: "KineClub",
    icon: ShieldCheck,
    desc: "Descuentos exclusivos en comercios, turismo y servicios para vos y tu familia.",
  },
];

export default function CtaPills() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="mb-14">
      <div className="flex flex-wrap gap-3 mb-4">
        {pills.map(({ label, icon: Icon }, index) => (
          <button
            key={label}
            onMouseEnter={() => setActive(index)}
            onMouseLeave={() => setActive(null)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all ${
              active === index
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-slate-50 border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active === index ? "text-white" : "text-blue-500"}`} />
            {label}
          </button>
        ))}
      </div>

      <div className="h-10 relative mt-2">
        {pills.map(({ desc }, index) => (
          <p
            key={index}
            className={`absolute inset-0 text-slate-500 text-sm leading-relaxed transition-all duration-300 ease-out ${
              active === index
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-1 pointer-events-none"
            }`}
          >
            {desc}
          </p>
        ))}
      </div>
    </div>
  );
}
