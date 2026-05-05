"use client";

import { Edit2, Ban, CheckCircle2, Trash2 } from "lucide-react";
import Link from "next/link";
import { toggleEstadoProfesional, deleteProfesional } from "./actions";

export default function BotonesProfesional({ id, status }: { id: string, status: "ACTIVO" | "INACTIVO" | "PENDIENTE" }) {
  
  const handleToggleEstado = async () => {
    const nuevoEstado = status === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    if (confirm(`¿Estás seguro de que querés ${nuevoEstado === "ACTIVO" ? "activar" : "suspender"} a este profesional?`)) {
      await toggleEstadoProfesional(id, nuevoEstado);
    }
  };

  const handleDelete = async () => {
    if (confirm("¿Estás 100% seguro de eliminar este profesional? Esta acción no se puede deshacer.")) {
      await deleteProfesional(id);
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      <Link 
        href={`/admin/profesionales/${id}`}
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
        title="Editar Profesional"
      >
        <Edit2 className="h-4 w-4" />
      </Link>
      
      <button 
        onClick={handleToggleEstado}
        className={`p-2 rounded-lg transition-all ${
          status === "ACTIVO" 
            ? "text-slate-400 hover:text-orange-600 hover:bg-orange-50" 
            : "text-slate-400 hover:text-green-600 hover:bg-green-50"
        }`}
        title={status === "ACTIVO" ? "Suspender" : "Activar"}
      >
        {status === "ACTIVO" ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      </button>

      <button 
        onClick={handleDelete}
        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        title="Eliminar"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
