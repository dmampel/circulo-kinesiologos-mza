"use client";

import { useState } from "react";
import { Reorder } from "framer-motion";
import { GripVertical, Plus, Edit2, Trash2, CheckCircle2, XCircle, Link as LinkIcon, Image as ImageIcon, Search } from "lucide-react";
import { ObraSocial } from "@prisma/client";
import { saveObraSocial, deleteObraSocial, toggleActiva, updateOrden } from "./actions";
import { cn } from "@/lib/utils";

interface ClientObrasSocialesProps {
  initialObras: ObraSocial[];
}

export default function ClientObrasSociales({ initialObras }: ClientObrasSocialesProps) {
  const [obras, setObras] = useState<ObraSocial[]>(initialObras);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<ObraSocial | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const handleReorder = async (newOrder: ObraSocial[]) => {
    setObras(newOrder);
    setIsReordering(true);
    
    // Map to updated orden
    const itemsToUpdate = newOrder.map((obra, index) => ({
      id: obra.id,
      orden: index,
    }));

    await updateOrden(itemsToUpdate);
    setIsReordering(false);
  };

  const openModal = (obra?: ObraSocial) => {
    setEditingObra(obra || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingObra(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingObra?.id,
      nombre: formData.get("nombre") as string,
      logo_url: formData.get("logo_url") as string,
      convenio_url: formData.get("convenio_url") as string,
      activa: formData.get("activa") === "true",
    };

    const res = await saveObraSocial(data);
    if (res.success) {
      // Optistic update can be done here, but server revalidation handles the refresh.
      // We will just reload the window for simplicity or rely on next/cache revalidation 
      // (Next.js automatically refreshes the route data).
      closeModal();
      window.location.reload();
    } else {
      alert("Error al guardar");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que querés eliminar esta obra social?")) {
      const res = await deleteObraSocial(id);
      if (res.success) {
        window.location.reload();
      }
    }
  };

  const handleToggle = async (obra: ObraSocial) => {
    const res = await toggleActiva(obra.id, !obra.activa);
    if (res.success) {
      setObras(prev => prev.map(o => o.id === obra.id ? { ...o, activa: !o.activa } : o));
    }
  };

  const obrasFiltradas = searchQuery
    ? obras.filter((o) => o.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    : obras;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-slate-500 flex items-center">
          <GripVertical className="h-4 w-4 mr-2" />
          Arrastrá para reordenar.
          {isReordering && (
            <span className="ml-2 text-blue-500 font-bold animate-pulse">Guardando...</span>
          )}
        </p>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center shadow-lg shadow-blue-900/20 transition-all shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Obra Social
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-slate-900 text-sm">Obras Sociales y Convenios</h3>
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-black">
              {obrasFiltradas.length}
            </span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <Search className="ml-2 h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar obra social..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium pr-4 outline-none w-44"
            />
          </div>
        </div>
        {obrasFiltradas.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            {searchQuery ? `No se encontraron resultados para "${searchQuery}".` : "No hay obras sociales registradas aún."}
          </div>
        ) : (
          <Reorder.Group axis="y" values={obrasFiltradas} onReorder={handleReorder} className="divide-y divide-slate-50 w-full">
            {obrasFiltradas.map((obra) => (
              <Reorder.Item
                key={obra.id}
                value={obra}
                className="flex items-center px-6 py-4 bg-white cursor-grab active:cursor-grabbing hover:bg-slate-50/50 transition-colors"
              >
                <div className="mr-4 text-slate-300">
                  <GripVertical className="h-5 w-5" />
                </div>
                
                <div className="h-12 w-12 rounded-xl border border-slate-100 overflow-hidden flex-shrink-0 bg-slate-50 flex items-center justify-center mr-4">
                  {obra.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={obra.logo_url} alt={obra.nombre} className="h-full w-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-slate-300" />
                  )}
                </div>

                <div className="flex-grow">
                  <h3 className="font-bold text-slate-900">{obra.nombre}</h3>
                  <div className="flex items-center mt-1 space-x-3 text-xs text-slate-400 font-medium">
                    {obra.convenio_url ? (
                      <a href={obra.convenio_url} target="_blank" rel="noreferrer" className="flex items-center hover:text-blue-500 transition-colors">
                        <LinkIcon className="h-3 w-3 mr-1" /> Ver Convenio
                      </a>
                    ) : (
                      <span className="flex items-center"><LinkIcon className="h-3 w-3 mr-1" /> Sin convenio adjunto</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => handleToggle(obra)}
                    className={cn(
                      "flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors",
                      obra.activa ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    {obra.activa ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    {obra.activa ? "Activa" : "Inactiva"}
                  </button>

                  <div className="flex items-center space-x-2 border-l border-slate-100 pl-4">
                    <button onClick={() => openModal(obra)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(obra.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-6">
              {editingObra ? "Editar Obra Social" : "Nueva Obra Social"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
                <input 
                  type="text" 
                  name="nombre" 
                  required 
                  defaultValue={editingObra?.nombre}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-900"
                  placeholder="Ej: OSDE"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">URL del Logo (Opcional)</label>
                <input 
                  type="url" 
                  name="logo_url" 
                  defaultValue={editingObra?.logo_url || ""}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-900"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">URL del Convenio PDF (Opcional)</label>
                <input 
                  type="url" 
                  name="convenio_url" 
                  defaultValue={editingObra?.convenio_url || ""}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-900"
                  placeholder="https://..."
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="activa" 
                    value="true"
                    defaultChecked={editingObra ? editingObra.activa : true}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Obra Social Activa</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-6">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
