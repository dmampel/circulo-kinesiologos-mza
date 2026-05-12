import Sidebar from "@/components/socio/Sidebar";
import MobileSidebarShell from "@/components/socio/MobileSidebarShell";
import { createClient } from "@/utils/supabase/server";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { CircularRepository } from "@/lib/repositories/CircularRepository";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profesional = await ProfesionalRepository.findByUserId(user.id);
  let unreadCount = 0;

  if (profesional) {
    unreadCount = await CircularRepository.countUnread(profesional.id);
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex lg:h-screen lg:overflow-hidden">
      <MobileSidebarShell>
        <Sidebar unreadCirculares={unreadCount} />
      </MobileSidebarShell>
      <main className="flex-1 lg:overflow-y-auto">
        <div className="mx-auto max-w-6xl py-5 px-4 sm:px-6 lg:px-5 pt-16 lg:pt-5">
          {children}
        </div>
      </main>
    </div>
  );
}
