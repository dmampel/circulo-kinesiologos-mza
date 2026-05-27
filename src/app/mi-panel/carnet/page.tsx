import { createClient } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { redirect } from "next/navigation";
import CarnetFlip from "@/components/socio/CarnetFlip";

export const dynamic = "force-dynamic";

export default async function CarnetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/mi-panel");

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-10 animate-in fade-in duration-500">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Panel Profesional · CKM</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Tu Credencial</h1>
        <p className="text-sm text-slate-500 font-medium pt-1">Tocá la credencial para ver el QR. Compartila con quien quieras.</p>
      </div>

      <CarnetFlip profesional={profesional} />
    </div>
  );
}
