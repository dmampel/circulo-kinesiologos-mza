"use client";

import { Trash2 } from "lucide-react";
import { eliminarAutoridadAction } from "../actions";

export default function DeleteAutoridadButton({ id }: { id: string }) {
  return (
    <form
      action={eliminarAutoridadAction.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm("¿Eliminás esta autoridad? Esta acción no se puede deshacer.")) {
          e.preventDefault();
        }
      }}
      className="inline"
    >
      <button
        type="submit"
        className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
        title="Eliminar"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
