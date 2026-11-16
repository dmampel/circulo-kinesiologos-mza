"use client";

import { useRef, useState } from "react";
import { ChevronDown, MapPin, Plus, Trash2 } from "lucide-react";

export interface DomicilioRow {
  direccion: string;
  localidadId: string;
}

interface Props {
  localidades: { id: string; nombre: string }[];
  defaultValue?: DomicilioRow[];
  onChange?: (rows: DomicilioRow[]) => void;
}

type Row = DomicilioRow & { key: number };

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all";
const labelCls = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

/**
 * Filas editables; serializa a un input hidden `domiciliosAdicionales` (JSON).
 *
 * Los campos son NO controlados (`defaultValue`) a propósito: React 19 resetea
 * los forms con `action` al terminar, y un <select> controlado vuelve a su
 * primera opción ("Localidad") aunque el state tenga el valor elegido. Con
 * `defaultValue` el reset restaura el valor correcto. Cada fila tiene un `key`
 * estable para que quitar una del medio no corra los valores de las demás.
 * El padre debería remontar este componente (`key`) cuando cambian los datos
 * guardados, así las filas nuevas pasan a ser "iniciales".
 */
export default function DomiciliosAdicionalesField({ localidades, defaultValue = [], onChange }: Props) {
  const nextKey = useRef(defaultValue.length);
  const [rows, setRows] = useState<Row[]>(() => defaultValue.map((d, i) => ({ ...d, key: i })));

  const apply = (next: Row[]) => {
    setRows(next);
    onChange?.(next.map(({ direccion, localidadId }) => ({ direccion, localidadId })));
  };
  const update = (key: number, patch: Partial<DomicilioRow>) =>
    apply(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const serializado = JSON.stringify(rows.map(({ direccion, localidadId }) => ({ direccion, localidadId })));

  return (
    <div className="space-y-3">
      <div>
        <p className={`flex items-center gap-2 ${labelCls}`}>
          <MapPin className="h-3.5 w-3.5" />
          Otros domicilios de atención
        </p>
        <p className="mt-1 text-[10px] text-slate-400">
          Si atendés en más de un lugar, agregalos acá. Aparecen en tu perfil del Padrón Público.
        </p>
      </div>
      <input type="hidden" name="domiciliosAdicionales" value={serializado} />

      {rows.map((row, i) => (
        <div key={row.key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Domicilio {i + 2}</span>
            <button
              type="button"
              onClick={() => apply(rows.filter((r) => r.key !== row.key))}
              aria-label={`Quitar domicilio ${i + 2}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Quitar
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor={`dom-dir-${row.key}`} className={labelCls}>
                Dirección
              </label>
              <input
                id={`dom-dir-${row.key}`}
                type="text"
                placeholder="Ej: Av. Colón 123"
                defaultValue={row.direccion}
                onChange={(e) => update(row.key, { direccion: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`dom-loc-${row.key}`} className={labelCls}>
                Localidad
              </label>
              <div className="relative">
                <select
                  id={`dom-loc-${row.key}`}
                  defaultValue={row.localidadId}
                  onChange={(e) => update(row.key, { localidadId: e.target.value })}
                  className={`${inputCls} appearance-none pr-10`}
                >
                  <option value="">Seleccioná una localidad</option>
                  {localidades.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => apply([...rows, { key: nextKey.current++, direccion: "", localidadId: "" }])}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/40 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Agregar otro domicilio
      </button>
    </div>
  );
}
