"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Tag,
  Trash2,
  Loader2,
  Newspaper,
  Star,
  Megaphone,
  BookOpen,
  Globe,
  Sparkles,
  Edit,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { crearCategoria, actualizarCategoria, eliminarCategoria } from "./categoria-actions";
import { cn } from "@/lib/utils";

const ICON_OPTIONS = [
  { name: "Tag", icon: Tag },
  { name: "Newspaper", icon: Newspaper },
  { name: "Star", icon: Star },
  { name: "Megaphone", icon: Megaphone },
  { name: "BookOpen", icon: BookOpen },
  { name: "Globe", icon: Globe },
  { name: "Sparkles", icon: Sparkles },
];

const COLOR_OPTIONS = ["blue", "red", "green", "orange", "purple", "pink", "slate"];

interface Categoria {
  id: string;
  nombre: string;
  icono: string | null;
  color: string | null;
}

interface Props {
  categorias: Categoria[];
}

export default function CategoriaSidebar({ categorias }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("Tag");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (editingCat) {
      setNombre(editingCat.nombre);
      setSelectedIcon(editingCat.icono || "Tag");
      setSelectedColor(editingCat.color || "blue");
    } else {
      setNombre("");
      setSelectedIcon("Tag");
      setSelectedColor("blue");
    }
  }, [editingCat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("icono", selectedIcon);
    formData.append("color", selectedColor);

    let result;
    if (editingCat) {
      result = await actualizarCategoria(editingCat.id, formData);
    } else {
      result = await crearCategoria(formData);
    }

    if (result.success) {
      setEditingCat(null);
      setNombre("");
    } else {
      alert("Error: " + result.error);
    }
    setIsPending(false);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;
    const result = await eliminarCategoria(id);
    if (!result.success) alert(result.error);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-6 py-4 rounded-2xl bg-white border border-slate-100 text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
      >
        <Tag className="mr-2 h-5 w-5" /> Gestionar Categorías
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">Categorías</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Formulario dual crear/editar */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {editingCat ? "Editando Categoría" : "Nueva Categoría"}
                    </h3>
                    {editingCat && (
                      <button
                        onClick={() => setEditingCat(null)}
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
                      placeholder="Nombre (ej: Institucional)"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold"
                    />

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Icono
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ICON_OPTIONS.map((opt) => (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() => setSelectedIcon(opt.name)}
                            className={cn(
                              "p-3 rounded-xl border transition-all",
                              selectedIcon === opt.name
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-white border-slate-100 text-slate-400 hover:border-blue-200"
                            )}
                          >
                            <opt.icon className="h-5 w-5" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={cn(
                              "h-8 w-8 rounded-full border-4 transition-all",
                              `bg-${color}-500`,
                              selectedColor === color
                                ? "border-white ring-2 ring-slate-900"
                                : "border-transparent"
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className={cn(
                        "w-full flex items-center justify-center py-4 rounded-2xl text-white font-black transition-all disabled:opacity-50",
                        editingCat ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-slate-800"
                      )}
                    >
                      {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : editingCat ? (
                        <Save className="mr-2 h-5 w-5" />
                      ) : (
                        <Plus className="mr-2 h-5 w-5" />
                      )}
                      {editingCat ? "Guardar Cambios" : "Crear Categoría"}
                    </button>
                  </form>
                </div>

                <hr className="border-slate-50" />

                {/* Listado de categorías existentes */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Existentes
                  </h3>
                  <div className="space-y-2">
                    {categorias.map((cat) => {
                      const IconComp = ICON_OPTIONS.find((o) => o.name === cat.icono)?.icon || Tag;
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={cn(
                                "p-2 rounded-lg text-white",
                                `bg-${cat.color || "slate"}-500`
                              )}
                            >
                              <IconComp className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-slate-700">{cat.nombre}</span>
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => setEditingCat(cat)}
                              className="p-2 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEliminar(cat.id)}
                              className="p-2 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
