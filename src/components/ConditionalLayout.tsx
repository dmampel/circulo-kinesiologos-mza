"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isPortal = pathname?.startsWith("/mi-panel");

  return (
    <>
      {!isAdmin && !isPortal && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {!isAdmin && !isPortal && <Footer />}
    </>
  );
}
