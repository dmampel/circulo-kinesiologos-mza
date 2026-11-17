"use client";

import { useRef, useState } from "react";
import { Phone, Plus, Trash2 } from "lucide-react";
import { MAX_TELEFONOS_ADICIONALES } from "@/lib/telefonos";

interface Props {
  defaultValue?: string[];
  onChange?: (telefonos: string[]) => void;
}

type Row = { key: number; value: string };

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all";
const labelCls = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

/**
 * Filas de teléfonos extra. Cada input se envía como `telefonosAdicionales`
 * (formData.getAll). Inputs NO controlados (`defaultValue`) por el mismo motivo
 * que DomiciliosAdicionalesField: React 19 resetea los forms con `action`.
 */
export default function TelefonosAdicionalesField({ defaultValue = [], onChange }: Props) {
  const nextKey = useRef(defaultValue.length);
  const [rows, setRows] = useState<Row[]>(() => defaultValue.map((value, key) => ({ key, value })));

  const apply = (next: Row[]) => {
    setRows(next);
    onChange?.(next.map((r) => r.value));
  };

  return (
    <div className="space-y-3">
      <div>
        <p className={`flex items-center gap-2 ${labelCls}`}>
          <Phone className="h-3.5 w-3.5" />
          Otros teléfonos
        </p>
        <p className="mt-1 text-[10px] text-slate-400">Si tenés más de un número de contacto, agregalos acá.</p>
      </div>

      <input type="hidden" name="telefonosAdicionalesEnviados" value="1" />

      {rows.map((row, i) => (
        <div key={row.key} className="flex items-center gap-2">
          <input
            type="tel"
            name="telefonosAdicionales"
            maxLength={30}
            aria-label={`Teléfono adicional ${i + 1}`}
            placeholder="Ej: 261 4000000"
            defaultValue={row.value}
            onChange={(e) => apply(rows.map((r) => (r.key === row.key ? { ...r, value: e.target.value } : r)))}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => apply(rows.filter((r) => r.key !== row.key))}
            aria-label={`Quitar teléfono adicional ${i + 1}`}
            className="shrink-0 rounded-lg p-2.5 text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {rows.length < MAX_TELEFONOS_ADICIONALES && (
        <button
          type="button"
          onClick={() => apply([...rows, { key: nextKey.current++, value: "" }])}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/40 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar otro teléfono
        </button>
      )}
    </div>
  );
}
