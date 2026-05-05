"use client";

import { useState } from "react";
import { saveProfesional } from "./actions";
import { useRouter } from "next/navigation";
import { Localidad, Especialidad, Profesional } from "@prisma/client";

interface FormProfesionalProps {
  profesional?: Profesional & { especialidades?: Especialidad[] };
  localidades: Localidad[];
  especialidades: Especialidad[];
}

export default function FormProfesional({ profesional, localidades, especialidades }: FormProfesionalProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<string[]>(
    profesional?.especialidades?.map(e => e.id) || []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      id: profesional?.id,
      nombre: formData.get("nombre"),
      apellido: formData.get("apellido"),
      matricula: formData.get("matricula"),
      dni: formData.get("dni"),
      email: formData.get("email"),
      telefono: formData.get("telefono"),
      whatsapp: formData.get("whatsapp"),
      direccion: formData.get("direccion"),
      horarios: formData.get("horarios"),
      foto_url: formData.get("foto_url"),
      localidadId: formData.get("localidadId"),
      status: formData.get("status") || "ACTIVO",
    };

    const res = await saveProfesional(data, selectedEspecialidades);
    if (res.success) {
      router.push("/admin/profesionales");
    } else {
      alert(res.error || "Error al guardar");
      setIsSaving(false);
    }
  };

  const toggleEspecialidad = (id: string) => {
    setSelectedEspecialidades(prev => 
      prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-12 space-y-8">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Datos Personales */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Datos Personales</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre *</label>
              <input type="text" name="nombre" required defaultValue={profesional?.nombre} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Apellido *</label>
              <input type="text" name="apellido" required defaultValue={profesional?.apellido} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">DNI</label>
              <input type="text" name="dni" defaultValue={profesional?.dni || ""} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Matrícula *</label>
              <input type="text" name="matricula" required defaultValue={profesional?.matricula} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">URL de Foto (Opcional)</label>
            <input type="url" name="foto_url" defaultValue={profesional?.foto_url || ""} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900" />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Estado</label>
            <select name="status" defaultValue={profesional?.status || "ACTIVO"} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900">
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
              <option value="PENDIENTE">PENDIENTE</option>
            </select>
          </div>
        </div>

        {/* Contacto y Consultorio */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Contacto y Consultorio</h3>
          
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
            <input type="email" name="email" defaultValue={profesional?.email || ""} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Teléfono</label>
              <input type="text" name="telefono" defaultValue={profesional?.telefono || ""} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">WhatsApp</label>
              <input type="text" name="whatsapp" defaultValue={profesional?.whatsapp || ""} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Localidad *</label>
            <select name="localidadId" required defaultValue={profesional?.localidadId || ""} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900">
              <option value="" disabled>Seleccioná una localidad</option>
              {localidades.map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Dirección de consultorio</label>
            <input type="text" name="direccion" defaultValue={profesional?.direccion || ""} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900" />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Horarios</label>
            <textarea name="horarios" rows={2} defaultValue={profesional?.horarios || ""} placeholder="Ej: Lunes a Viernes de 9 a 17hs" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900"></textarea>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-lg font-black text-slate-900 mb-4">Especialidades</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {especialidades.map(esp => {
            const isSelected = selectedEspecialidades.includes(esp.id);
            return (
              <button
                type="button"
                key={esp.id}
                onClick={() => toggleEspecialidad(esp.id)}
                className={`px-4 py-3 text-sm font-bold rounded-xl transition-all border text-left ${
                  isSelected 
                    ? "bg-blue-50 border-blue-200 text-blue-700" 
                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                }`}
              >
                {esp.nombre}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-8 border-t border-slate-100">
        <button 
          type="button" 
          onClick={() => router.push("/admin/profesionales")}
          className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isSaving}
          className="px-8 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
        >
          {isSaving ? "Guardando..." : "Guardar Profesional"}
        </button>
      </div>
    </form>
  );
}
