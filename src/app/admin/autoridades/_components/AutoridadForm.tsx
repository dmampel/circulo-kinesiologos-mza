"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearAutoridad, actualizarAutoridad, buscarProfesionales } from "../actions";
import { Shield, ChevronRight, Search, RefreshCw, ChevronDown } from "lucide-react";
import { CARGOS_AUTORIDADES } from "@/lib/constants";
import { useDebouncedCallback } from "use-debounce";

interface Profesional {
  id: string;
  nombre: string;
  apellido: string;
  matricula: string;
}

interface AutoridadFormProps {
  profesional: Profesional;
  id?: string;
  initialValues?: {
    cargo: string;
    orden: number;
  };
}

export default function AutoridadForm({ profesional: initialProfesional, id, initialValues }: AutoridadFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number>(initialValues?.orden || 0);
  
  // Professional state
  const [currentProfesional, setCurrentProfesional] = useState(initialProfesional);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Profesional[]>([]);
  const [searching, setSearching] = useState(false);
  
  const router = useRouter();
  const isEditing = !!id;

  const handleSearch = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const result = await buscarProfesionales(query);
    if (result.success && result.data) {
      setSearchResults(result.data as Profesional[]);
    }
    setSearching(false);
  }, 300);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("profesionalId", currentProfesional.id);

    const result = isEditing 
      ? await actualizarAutoridad(id, formData)
      : await crearAutoridad(formData);

    if (result?.success) {
      router.push("/admin/autoridades");
    } else {
      alert("Error: " + result?.error);
      setLoading(false);
    }
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const cargo = CARGOS_AUTORIDADES.find(c => c.nombre === value);
    if (cargo) {
      setSelectedOrder(cargo.orden);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-blue-900/5 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-3 mb-8">
        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-black text-slate-900 uppercase tracking-tight">
            {isEditing ? "Editar Autoridad" : "Asignar Cargo"}
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            {isEditing ? "Actualizar registro" : "Paso 2 de 2"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input oculto para el orden automático */}
        <input type="hidden" name="orden" value={selectedOrder} />

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profesional</p>
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              {showSearch ? "Cancelar" : "Cambiar Profesional"}
            </button>
          </div>

          {!showSearch ? (
            <div className="animate-in fade-in duration-300">
              <p className="font-black text-slate-900">{currentProfesional.apellido}, {currentProfesional.nombre}</p>
              <p className="text-xs font-bold text-slate-500">M.P. {currentProfesional.matricula}</p>
            </div>
          ) : (
            <div className="mt-2 space-y-3 animate-in slide-in-from-top-2 duration-300">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar profesional..."
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {searching ? (
                  <p className="text-[10px] text-slate-400 font-bold animate-pulse text-center py-4">Buscando...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setCurrentProfesional(p);
                        setShowSearch(false);
                        setSearchResults([]);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all text-left"
                    >
                      <div>
                        <p className="text-xs font-black text-slate-900">{p.apellido}, {p.nombre}</p>
                        <p className="text-[9px] font-bold text-slate-400">M.P. {p.matricula}</p>
                      </div>
                      <RefreshCw className="h-3 w-3 text-blue-500" />
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 font-bold text-center py-4 uppercase tracking-widest">Escribí para buscar</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo Institucional</label>
          <div className="relative">
            <select
              name="cargo"
              required
              defaultValue={initialValues?.cargo}
              onChange={handleRoleChange}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 text-sm font-bold appearance-none cursor-pointer pr-12"
            >
              <option value="">Seleccionar cargo...</option>
              {CARGOS_AUTORIDADES.map((c) => (
                <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
            Información de Sistema
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            El orden de visualización será <span className="font-black text-blue-600">#{selectedOrder}</span> según el cargo elegido.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
        >
          {loading ? "Guardando..." : (
            <>
              {isEditing ? "Guardar Cambios" : "Confirmar Alta"} <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
