"use client";

type ObraSocial = { id: string; nombre: string };

export default function ObrasSocialesMarquee({ items }: { items: ObraSocial[] }) {
  const mid = Math.ceil(items.length / 2);
  const row1 = items.slice(0, mid);
  const row2 = items.slice(mid);

  const Pill = ({ nombre }: { nombre: string }) => (
    <span className="shrink-0 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-medium mx-1.5">
      {nombre}
    </span>
  );

  return (
    <div className="marquee-track overflow-hidden space-y-3 my-4 select-none">
      {/* Row 1 — left */}
      <div className="flex w-max animate-marquee">
        {[...row1, ...row1].map((os, i) => (
          <Pill key={`r1-${i}`} nombre={os.nombre} />
        ))}
      </div>
      {/* Row 2 — right */}
      <div className="flex w-max animate-marquee-reverse">
        {[...row2, ...row2].map((os, i) => (
          <Pill key={`r2-${i}`} nombre={os.nombre} />
        ))}
      </div>
    </div>
  );
}
