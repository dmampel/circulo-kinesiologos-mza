import Sidebar from "@/components/socio/Sidebar";
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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar unreadCirculares={unreadCount} />
      <main className="flex-grow overflow-y-auto">
        <div className="mx-auto max-w-6xl py-5 px-5">{children}</div>
      </main>
    </div>
  );
}
