"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Bell,
  ShieldCheck,
  Briefcase,
  Ticket,
  Globe,
  BookOpen,
  Megaphone,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const SIDEBAR_LINKS: {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}[] = [
  { name: "Resumen", href: "/admin", icon: LayoutDashboard },
  { name: "Solicitudes", href: "/admin/solicitudes", icon: Bell },
  { name: "Profesionales", href: "/admin/profesionales", icon: Users },
  { name: "Obras Sociales", href: "/admin/obras-sociales", icon: Briefcase },
  { name: "KineClub", href: "/admin/beneficios", icon: Ticket },
  { name: "Noticias", href: "/admin/noticias", icon: FileText },
  { name: "Autoridades", href: "/admin/autoridades", icon: ShieldCheck },
  { name: "Circulares", href: "/admin/circulares", icon: Megaphone },
  { name: "Capacitaciones", href: "/admin/capacitaciones", icon: BookOpen },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Mensaje desktop-only en mobile */}
      <div className="lg:hidden fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <div className="h-20 w-20 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-8">
          <Monitor className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-4 tracking-tight">
          Panel de Administración
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
          Este panel está optimizado para computadoras de escritorio. Por favor, ingresá desde una pantalla más grande.
        </p>
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white fixed h-full z-20 hidden lg:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <ShieldCheck className="h-6 w-6" />
          </div>
            <p className="font-black tracking-tight text-lg text-white">Panel de Admin</p>
          </div>
        </div>

        <nav className="flex-grow p-6 space-y-2">
          {SIDEBAR_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                )}
              >
                <div className="flex items-center">
                  <Icon className="mr-3 h-5 w-5" />
                  {link.name}
                </div>
                {link.badge && (
                  <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="flex items-center w-full px-4 py-3 text-sm font-bold text-slate-400 hover:text-blue-400 transition-colors"
          >
            <Globe className="mr-3 h-5 w-5" /> Volver al Sitio
          </Link>
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-sm font-bold text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="mr-3 h-5 w-5" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Topbar */}
      
    </>
  );
}
