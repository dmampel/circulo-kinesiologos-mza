import { createClient } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import PerfilForm from "@/components/socio/PerfilForm";

export const metadata = {
  title: "Mi Perfil | CKM Portal",
  description: "Gestioná tus datos de contacto y foto de perfil profesional.",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profesional = await ProfesionalRepository.findByUserId(user.id);

  if (!profesional) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-20 w-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mb-8">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
          Perfil no encontrado
        </h2>
        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
          Tu cuenta no está asociada a un perfil profesional. Comunicate con administración.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Panel Profesional · CKM</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Mi Perfil</h1>
        <p className="text-sm text-slate-500 font-medium pt-1">
          Actualizá tus datos de contacto y foto. Los cambios se reflejan automáticamente en el Padrón Público.
        </p>
      </div>

      {/* Form */}
      <PerfilForm
        profesional={{
          nombre: profesional.nombre,
          apellido: profesional.apellido,
          matricula: profesional.matricula,
          telefono: profesional.telefono ?? null,
          whatsapp: profesional.whatsapp ?? null,
          direccion: profesional.direccion ?? null,
          horarios: profesional.horarios ?? null,
          foto_url: profesional.foto_url ?? null,
        }}
      />
    </div>
  );
}
