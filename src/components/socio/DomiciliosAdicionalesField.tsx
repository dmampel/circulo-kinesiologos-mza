"use client";

import { useState } from "react";

export interface DomicilioRow {
  direccion: string;
  localidadId: string;
}

interface Props {
  localidades: { id: string; nombre: string }[];
  defaultValue?: DomicilioRow[];
  onChange?: (rows: DomicilioRow[]) => void;
}

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all";

/** Filas editables; serializa a un input hidden `domiciliosAdicionales` (JSON). */
export default function DomiciliosAdicionalesField({ localidades, defaultValue = [], onChange }: Props) {
  const [rows, setRows] = useState<DomicilioRow[]>(defaultValue);

  const apply = (next: DomicilioRow[]) => {
    setRows(next);
    onChange?.(next);
  };
  const update = (i: number, patch: Partial<DomicilioRow>) =>
    apply(rows.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        Otros domicilios de atención
      </p>
      <input type="hidden" name="domiciliosAdicionales" value={JSON.stringify(rows)} />

      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
          <input
            type="text"
            aria-label={`Dirección adicional ${i + 1}`}
            placeholder="Ej: Av. Colón 123"
            value={row.direccion}
            onChange={(e) => update(i, { direccion: e.target.value })}
            className={inputCls}
          />
          <select
            aria-label={`Localidad adicional ${i + 1}`}
            value={row.localidadId}
            onChange={(e) => update(i, { localidadId: e.target.value })}
            className={inputCls}
          >
            <option value="">Localidad</option>
            {localidades.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => apply(rows.filter((_, idx) => idx !== i))}
            className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl"
          >
            Quitar
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => apply([...rows, { direccion: "", localidadId: "" }])}
        className="text-xs font-bold text-blue-600 hover:underline"
      >
        + Agregar otro domicilio
      </button>
    </div>
  );
}
