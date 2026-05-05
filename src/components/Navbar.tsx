"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { name: "Inicio", href: "/" },
  { name: "Padron de Profesionales", href: "/profesionales" },
  { name: "Obras Sociales", href: "/obras-sociales" },
  { name: "KineClub", href: "/kineclub" },
  { name: "Noticias", href: "/noticias" },
  { name: "Institucional", href: "/institucional" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">CK</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight text-slate-900">Círculo de Kinesiólogos</span>
              <span className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">Mendoza</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/registro"
              className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Asociate
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-blue-600 p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b animate-in slide-in-from-top duration-300">
          <div className="space-y-1 px-4 pb-6 pt-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-md px-3 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4">
              <Link
                href="/registro"
                onClick={() => setIsOpen(false)}
                className="block w-full rounded-xl bg-blue-600 px-3 py-4 text-center text-base font-bold text-white shadow-md"
              >
                Asociate al Círculo
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
