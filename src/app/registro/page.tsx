"use client";

import { useState } from "react";
import { 
  User, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  Info,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { crearSolicitud, getLocalidades, getEspecialidades } from "./actions";
import { useEffect } from "react";

const STEPS = [
  { id: 1, title: "Datos Personales", icon: User },
  { id: 2, title: "Profesionales", icon: ShieldCheck },
  { id: 3, title: "Documentación", icon: FileText },
];

export default function RegistroPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [localidades, setLocalidades] = useState<{id: string, nombre: string}[]>([]);
  const [especialidades, setEspecialidades] = useState<{id: string, nombre: string}[]>([]);
  const [archivos, setArchivos] = useState<Record<string, File | null>>({
    dni: null,
    titulo: null,
    cuit: null,
    seguro: null,
    cv: null,
    matricula_file: null,
    super_salud: null,
    habilitacion: null,
  });
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    matricula: "",
    especialidad: "",
    direccion: "",
    localidadId: "",
  });

  useEffect(() => {
    getLocalidades().then(setLocalidades);
    getEspecialidades().then(setEspecialidades);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivos(prev => ({ ...prev, [field]: file }));
    }
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      return formData.nombre && formData.apellido && formData.dni && formData.email;
    }
    if (step === 2) {
      return formData.matricula && formData.especialidad && formData.direccion && formData.localidadId;
    }
    if (step === 3) {
      return archivos.dni && archivos.titulo && archivos.cuit && archivos.seguro && archivos.cv && archivos.matricula_file;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      alert("Por favor, completá todos los campos obligatorios antes de continuar.");
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      alert("Por favor, cargá todos los documentos requeridos para procesar tu solicitud.");
      return;
    }

    setIsPending(true);
    const data = new FormData();
    
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    Object.entries(archivos).forEach(([key, file]) => {
      if (file) data.append(key, file);
    });
    
    const result = await crearSolicitud(data);
    
    if (result?.error) {
      alert(`Error: ${result.error}`);
      setIsPending(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-4">

        {/* Header de Registro */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Solicitud de <span className="text-blue-600">Asociación</span></h1>
          <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
            Completá los datos para iniciar tu trámite de ingreso al Círculo de Kinesiólogos de Mendoza.
          </p>
        </div>

        {/* Banner: documentación requerida */}
        <div className="mb-12 bg-amber-50 border border-amber-200 rounded-3xl p-6 lg:p-8">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900 mb-3 uppercase tracking-widest">Documentación requerida</p>
              <p className="text-xs text-amber-700 mb-4 leading-relaxed">
                Antes de completar el formulario, tené listos los siguientes documentos en formato digital (PDF o imagen):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Fotocopia DNI (frente y dorso)",
                  "Título universitario (frente y dorso)",
                  "Constancia de CUIT e Ingresos Brutos",
                  "Póliza de seguro de mala praxis",
                  "Curriculum Vitae actualizado",
                  "Matrícula provincial vigente",
                  "Certificado Superintendencia de Salud",
                  "Habilitación del consultorio",
                ].map((doc) => (
                  <div key={doc} className="flex items-center gap-2 text-xs font-medium text-amber-800">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    {doc}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="relative mb-12 flex justify-between max-w-2xl mx-auto">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          {STEPS.map((step) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  currentStep >= step.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-slate-400 border-2 border-slate-100"
                )}
              >
                {currentStep > step.id ? <CheckCircle2 className="h-6 w-6" /> : <step.icon className="h-5 w-5" />}
              </div>
              <p className={cn(
                "mt-4 text-[10px] font-black uppercase tracking-widest transition-colors",
                currentStep >= step.id ? "text-blue-600" : "text-slate-400"
              )}>
                {step.title}
              </p>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 p-8 lg:p-16 border border-slate-50">
          
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-slate-900 mb-8">Información Personal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre <span className="text-red-500">*</span></label>
                  <input name="nombre" value={formData.nombre} onChange={handleChange} type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium" placeholder="Ej: Juan" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Apellido <span className="text-red-500">*</span></label>
                  <input name="apellido" value={formData.apellido} onChange={handleChange} type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium" placeholder="Ej: Pérez" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">DNI / CUIL <span className="text-red-500">*</span></label>
                  <input name="dni" value={formData.dni} onChange={handleChange} type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium" placeholder="20-XXXXXXXX-X" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email Personal <span className="text-red-500">*</span></label>
                  <input name="email" value={formData.email} onChange={handleChange} type="email" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium" placeholder="usuario@mail.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Teléfono / Celular</label>
                  <input name="telefono" value={formData.telefono} onChange={handleChange} type="tel" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium" placeholder="+54 261 ..." />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-slate-900 mb-8">Información Profesional</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Matrícula Profesional <span className="text-red-500">*</span></label>
                  <input name="matricula" value={formData.matricula} onChange={handleChange} type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium" placeholder="K-XXXX" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Especialidad Principal <span className="text-red-500">*</span></label>
                  <select name="especialidad" value={formData.especialidad} onChange={handleChange} required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium appearance-none">
                    <option value="">Seleccioná tu especialidad</option>
                    {especialidades.map((esp) => (
                      <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Localidad <span className="text-red-500">*</span></label>
                  <select name="localidadId" value={formData.localidadId} onChange={handleChange} required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium appearance-none">
                    <option value="">Seleccioná tu localidad</option>
                    {localidades.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Dirección de Consultorio <span className="text-red-500">*</span></label>
                  <input name="direccion" value={formData.direccion} onChange={handleChange} type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium" placeholder="Ej: Av. Colón 123" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-slate-900 mb-4">Documentación Necesaria</h2>
              <p className="text-sm text-slate-500 mb-10">Por favor, cargá todos los documentos requeridos para procesar tu solicitud.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "dni", label: "Fotocopia DNI (Frente y Dorso)" },
                  { id: "titulo", label: "Título Universitario (Frente y Dorso)" },
                  { id: "cuit", label: "Constancia de CUIT e Ingresos Brutos" },
                  { id: "seguro", label: "Póliza de Seguro Mala Praxis" },
                  { id: "cv", label: "Curriculum Vitae Actualizado" },
                  { id: "matricula_file", label: "Matrícula Provincial Vigente" },
                  { id: "super_salud", label: "Certificado Superintendencia de Salud" },
                  { id: "habilitacion", label: "Habilitación del Consultorio" },
                ].map((doc) => (
                  <div key={doc.id} className="relative group">
                    <input 
                      type="file" 
                      onChange={(e) => handleFileChange(e, doc.id)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={cn(
                      "flex items-center p-4 rounded-2xl border-2 border-dashed transition-all",
                      archivos[doc.id] ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-100 group-hover:border-blue-400 group-hover:bg-blue-50"
                    )}>
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center mr-4",
                        archivos[doc.id] ? "bg-white text-green-600" : "bg-white text-slate-400 group-hover:text-blue-600"
                      )}>
                        {archivos[doc.id] ? <CheckCircle2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{doc.label}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {archivos[doc.id] ? archivos[doc.id]?.name : "Click para subir"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-16 pt-8 border-t border-slate-50 flex items-center justify-between">
            {currentStep > 1 ? (
              <button 
                onClick={prevStep}
                className="flex items-center px-8 py-4 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all"
              >
                <ChevronLeft className="mr-2 h-5 w-5" /> Volver
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button 
                onClick={nextStep}
                className="flex items-center px-10 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                Siguiente Paso <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isPending}
                className="flex items-center px-10 py-4 rounded-2xl bg-blue-600 text-white font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>Procesando... <Loader2 className="ml-2 h-5 w-5 animate-spin" /></>
                ) : (
                  <>Finalizar Solicitud <CheckCircle2 className="ml-2 h-6 w-6" /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-12 flex items-start p-6 bg-blue-50 rounded-3xl text-blue-700">
          <Info className="h-5 w-5 mr-4 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed font-medium">
            Toda solicitud es revisada por la comisión directiva del Círculo. Una vez aprobada, recibirás tus credenciales de acceso al panel privado por correo electrónico en un plazo de 48 a 72 horas hábiles.
          </p>
        </div>
      </div>
    </div>
  );
}
