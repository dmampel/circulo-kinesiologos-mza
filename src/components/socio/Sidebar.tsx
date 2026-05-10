"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  UserCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building2,
  Star,
  BookOpen,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { title: "Dashboard", href: "/mi-panel", icon: LayoutDashboard },
  { title: "Mi Carnet", href: "/mi-panel/carnet", icon: CreditCard },
  { title: "Mi Perfil", href: "/mi-panel/perfil", icon: UserCircle },
];

const toolItems = [
  { title: "Obras Sociales", href: "/obras-sociales", icon: Building2 },
  { title: "KineClub", href: "/kineclub", icon: Star },
  { title: "Capacitaciones", href: "/mi-panel/capacitaciones", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="w-80 h-screen sticky top-0 bg-white border-r border-slate-100 flex flex-col px-6 py-5 z-50">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-black text-slate-900 leading-none tracking-tighter">
            CKFM <span className="text-blue-600">PORTAL</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Área de Socios
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                <span className="font-bold text-sm tracking-tight">{item.title}</span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="h-1.5 w-1.5 bg-blue-600 rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Tools Section */}
      <div className="mt-auto pt-6 border-t border-slate-100">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-3">
          Herramientas
        </p>
        <div className="space-y-1">
          {toolItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between p-3 rounded-xl transition-all duration-300 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-bold text-sm tracking-tight">{item.title}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4">
            <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm tracking-tight">Cerrar Sesión</span>
          </div>
          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-600 rounded-full blur-[100px] opacity-[0.03] pointer-events-none" />
    </aside>
  );
}
