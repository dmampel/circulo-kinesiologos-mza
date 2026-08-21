import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminSidebar from "./_components/AdminSidebar";

export default async function AdminLayout({
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

  if (user.app_metadata?.role !== "admin") {
    redirect("/mi-panel");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AdminSidebar />
      {/* Main Content Area */}
      <main className="flex-grow lg:ml-64">
        {/* Viewport */}
        <div className="pt-20 p-8">{children}</div>
      </main>
    </div>
  );
}
