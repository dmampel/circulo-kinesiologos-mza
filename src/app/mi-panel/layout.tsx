import Sidebar from "@/components/socio/Sidebar";
import MobileSidebarShell from "@/components/socio/MobileSidebarShell";
import { getAuthUser } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { CircularRepository } from "@/lib/repositories/CircularRepository";
import { SorteoRepository } from "@/lib/repositories/SorteoRepository";
import { CapacitacionRepository } from "@/lib/repositories/CapacitacionRepository";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    data: { user },
  } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  const profesional = await ProfesionalRepository.findByUserId(user.id);

  // `countUnread` depende del profesional resuelto arriba: no puede entrar
  // en un `Promise.all` anterior. `getLatestActive` y `getLatestPublicada`
  // no dependen de nada, ni siquiera del profesional, así que se agrupan acá
  // (design.md — D4a / Risks).
  const [unreadCount, latestSorteo, latestCapacitacion] = await Promise.all([
    profesional ? CircularRepository.countUnread(profesional.id) : Promise.resolve(0),
    SorteoRepository.getLatestActive(),
    CapacitacionRepository.getLatestPublicada(),
  ]);

  const latestSorteoTime = latestSorteo ? latestSorteo.createdAt.toISOString() : null;
  const latestCapacitacionTime = latestCapacitacion ? latestCapacitacion.createdAt.toISOString() : null;

  return (
    <div className="min-h-screen bg-slate-50 lg:flex lg:h-screen lg:overflow-hidden">
      <MobileSidebarShell>
        <Sidebar 
          unreadCirculares={unreadCount} 
          latestSorteoTime={latestSorteoTime} 
          latestCapacitacionTime={latestCapacitacionTime} 
        />
      </MobileSidebarShell>
      <main className="flex-1 lg:overflow-y-auto">
        <div className="mx-auto max-w-6xl py-5 px-4 sm:px-6 lg:px-5 pt-16 lg:pt-5">
          {children}
        </div>
      </main>
    </div>
  );
}
