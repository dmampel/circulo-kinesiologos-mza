import { createClient } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { redirect } from "next/navigation";
import CarnetFlip from "@/components/socio/CarnetFlip";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function CarnetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/mi-panel");

  return (
    <div className="flex flex-col gap-10 max-w-2xl mx-auto py-10">
      <div className="flex items-center justify-between">
        <Link
          href="/mi-panel"
          className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all group"
        >
          <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Volver al panel
        </Link>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Credencial Digital</p>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Tu Credencial</h1>
        <p className="text-sm text-slate-500 font-medium">Tocá la credencial para ver el QR. Compartila con quien quieras.</p>
      </div>

      <CarnetFlip profesional={profesional} />
    </div>
  );
}
