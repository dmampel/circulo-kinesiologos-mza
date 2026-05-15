"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isPortal = pathname?.startsWith("/mi-panel");
  const isInstitucional = pathname?.startsWith("/institucional");
  const isDiario = pathname?.startsWith("/noticias/diario");
  const isNoticias = pathname === "/noticias";

  return (
    <>
      {!isAdmin && !isPortal && !isDiario && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {!isAdmin && !isPortal && !isInstitucional && !isDiario && !isNoticias && <Footer />}
    </>
  );
}
