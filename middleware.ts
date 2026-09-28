import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Solo las rutas que chequean sesión adentro de updateSession(). El resto
  // del sitio es público y no necesita pagar un getUser() contra Supabase en
  // cada visita (esto es lo que se comía el Fluid Active CPU del free tier).
  matcher: ["/admin/:path*", "/mi-panel/:path*"],
};
