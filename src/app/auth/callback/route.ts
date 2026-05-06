import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Si hay un parámetro 'next', lo usamos, si no vamos al panel
  const next = searchParams.get("next") ?? "/mi-panel";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // En caso de error o si no hay código, volvemos al login
  return NextResponse.redirect(`${origin}/login?error=Invalid or expired token`);
}
