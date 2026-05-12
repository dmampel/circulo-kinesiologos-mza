"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface MobileSidebarShellProps {
  children: React.ReactNode;
}

export default function MobileSidebarShell({ children }: MobileSidebarShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on navigation
  // Wrapping in startTransition defers the setState out of the effect body,
  // satisfying the react-hooks/set-state-in-effect lint rule.
  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Body scroll lock when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Hamburger button — fixed top-left, visible only on mobile */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 left-4 z-40 lg:hidden bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-2 shadow-sm"
          aria-label="Abrir menú"
          aria-expanded={false}
        >
          <Menu className="h-5 w-5 text-slate-700" />
        </button>
      )}

      {/* Backdrop — visible only when open, mobile only */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer container */}
      <div
        className={`fixed left-0 top-0 h-full w-80 max-w-[85vw] z-50 transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:max-w-none lg:w-80 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label="Menú de navegación"
      >
        {/* Close button inside drawer — visible only on mobile */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 z-10 lg:hidden bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-2 shadow-sm"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5 text-slate-700" />
        </button>

        {children}
      </div>
    </>
  );
}
