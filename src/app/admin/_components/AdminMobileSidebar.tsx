"use client";

import { useEffect } from "react";
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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_LINKS = [
  { name: "Resumen", href: "/admin", icon: LayoutDashboard },
  { name: "Solicitudes", href: "/admin/solicitudes", icon: Bell, badge: "NUEVO" },
  { name: "Profesionales", href: "/admin/profesionales", icon: Users },
  { name: "Obras Sociales", href: "/admin/obras-sociales", icon: Briefcase },
  { name: "KineClub", href: "/admin/beneficios", icon: Ticket },
  { name: "Noticias", href: "/admin/noticias", icon: FileText },
  { name: "Autoridades", href: "/admin/autoridades", icon: ShieldCheck },
  { name: "Circulares", href: "/admin/circulares", icon: Megaphone },
  { name: "Capacitaciones", href: "/admin/capacitaciones", icon: BookOpen },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AdminMobileSidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(onClose, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 h-full w-72 max-w-[85vw] z-50 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label="Menú de administración"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="font-bold text-sm">CK</span>
            </div>
            <span className="font-black tracking-tight text-lg">Panel Admin</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
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

        <div className="p-4 border-t border-slate-800 space-y-1">
          <Link
            href="/"
            className="flex items-center w-full px-4 py-3 text-sm font-bold text-slate-400 hover:text-blue-400 transition-colors rounded-xl"
          >
            <Globe className="mr-3 h-5 w-5" /> Volver al Sitio
          </Link>
          <button className="flex items-center w-full px-4 py-3 text-sm font-bold text-slate-400 hover:text-red-400 transition-colors rounded-xl">
            <LogOut className="mr-3 h-5 w-5" /> Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}
