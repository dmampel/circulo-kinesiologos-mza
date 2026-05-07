"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

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
          <div className="hidden md:flex items-center space-x-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
            
            <div className="h-4 w-[1px] bg-slate-200 mx-2" />

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/mi-panel"
                      className="flex items-center text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      <User className="mr-2 h-4 w-4" /> Mi Panel
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/login"
                      className="text-sm font-bold text-slate-600 hover:text-blue-600"
                    >
                      Ingresar
                    </Link>
                    <Link
                      href="/registro"
                      className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                    >
                      Asociate
                    </Link>
                  </div>
                )}
              </>
            )}
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
            
            <div className="pt-4 space-y-3">
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link
                        href="/mi-panel"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center w-full rounded-xl bg-blue-50 text-blue-600 px-3 py-4 text-center text-base font-bold shadow-sm"
                      >
                        <User className="mr-3 h-5 w-5" /> Mi Panel
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                        className="flex items-center w-full rounded-xl bg-white border border-slate-100 text-slate-400 px-3 py-4 text-center text-base font-bold"
                      >
                        <LogOut className="mr-3 h-5 w-5" /> Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="block w-full rounded-xl bg-slate-100 px-3 py-4 text-center text-base font-bold text-slate-900"
                      >
                        Ingresar al Panel
                      </Link>
                      <Link
                        href="/registro"
                        onClick={() => setIsOpen(false)}
                        className="block w-full rounded-xl bg-blue-600 px-3 py-4 text-center text-base font-bold text-white shadow-md"
                      >
                        Asociate al Círculo
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
