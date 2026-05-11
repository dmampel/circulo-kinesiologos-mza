"use client";

import { useState, useEffect } from "react";
import { X, Plus, Stethoscope, Trash2, Loader2, Edit, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { crearEspecialidad, actualizarEspecialidad, eliminarEspecialidad } from "./especialidad-actions";

interface Especialidad {
  id: string;
  nombre: string;
}

interface Props {
  especialidades: Especialidad[];
}

export default function EspecialidadSidebar({ especialidades }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [editingEsp, setEditingEsp] = useState<Especialidad | null>(null);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (editingEsp) {
      setNombre(editingEsp.nombre);
    } else {
      setNombre("");
    }
  }, [editingEsp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData();
    formData.append("nombre", nombre);

    const result = editingEsp
      ? await actualizarEspecialidad(editingEsp.id, formData)
      : await crearEspecialidad(formData);

    if (result.success) {
      setEditingEsp(null);
      setNombre("");
    } else {
      alert("Error: " + result.error);
    }
    setIsPending(false);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta especialidad?")) return;
    const result = await eliminarEspecialidad(id);
    if (!result.success) alert(result.error);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-6 py-4 rounded-2xl bg-white border border-slate-100 text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
      >
        <Stethoscope className="mr-2 h-5 w-5" /> Gestionar Especialidades
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />

            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">Especialidades</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Formulario dual */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {editingEsp ? "Editando Especialidad" : "Nueva Especialidad"}
                    </h3>
                    {editingEsp && (
                      <button
                        onClick={() => setEditingEsp(null)}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Cancelar Edición
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      placeholder="Nombre (ej: Traumatología)"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold"
                    />

                    <button
                      type="submit"
                      disabled={isPending}
                      className={`w-full flex items-center justify-center py-4 rounded-2xl text-white font-black transition-all disabled:opacity-50 ${
                        editingEsp ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-slate-800"
                      }`}
                    >
                      {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : editingEsp ? (
                        <><Save className="mr-2 h-5 w-5" /> Guardar Cambios</>
                      ) : (
                        <><Plus className="mr-2 h-5 w-5" /> Crear Especialidad</>
                      )}
                    </button>
                  </form>
                </div>

                <hr className="border-slate-50" />

                {/* Listado */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Existentes</h3>
                  <div className="space-y-2">
                    {especialidades.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">No hay especialidades creadas.</p>
                    )}
                    {especialidades.map((esp) => (
                      <div key={esp.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <Stethoscope className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-slate-700">{esp.nombre}</span>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => setEditingEsp(esp)}
                            className="p-2 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEliminar(esp.id)}
                            className="p-2 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
