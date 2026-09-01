import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType, User } from "@supabase/supabase-js";

/**
 * Tipos de OTP que Supabase puede mandar por email. Se valida contra esta lista
 * en vez de castear: `type` viene de la query string, o sea del usuario.
 */
const TIPOS_OTP: readonly string[] = [
  "invite",
  "recovery",
  "signup",
  "magiclink",
  "email",
  "email_change",
];

function esTipoOtp(valor: string | null): valor is EmailOtpType {
  return valor !== null && TIPOS_OTP.includes(valor);
}

/**
 * Punto de entrada de todos los links de email de Supabase. Hay DOS formas de
 * llegar acá, segun quien genero el link:
 *
 * 1. `?code=` — flujos que dispara la propia app con `@supabase/ssr`, que usa
 *    PKCE y deja un `code_verifier` en una cookie del navegador. Ej: el reset
 *    de contraseña desde /forgot-password.
 *
 * 2. `?token_hash=` + `&type=` — links generados por la admin API
 *    (`inviteUserByEmail`, en la aprobación de solicitudes y en los scripts de
 *    migración). Ahí no hay navegador ni cookie cuando se genera el link, así
 *    que no puede haber PKCE: Supabase devolvía los tokens en el FRAGMENTO de
 *    la URL (`#access_token=...`), y el fragmento es la única parte de una URL
 *    que el navegador jamás manda al servidor. Este Route Handler no veía nada
 *    y caía siempre en "Invalid or expired token" — por eso ninguna invitación
 *    llegó nunca a activarse. `verifyOtp` valida el token contra Supabase desde
 *    el servidor y deja la cookie de sesión, sin depender del fragmento.
 *
 * Requiere que las plantillas de email (Invite / Reset Password) apunten acá
 * con `{{ .TokenHash }}`, no con el `{{ .ConfirmationURL }}` por defecto.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const explicitNext = searchParams.get("next");
  const next = explicitNext ?? "/mi-panel";

  const fallar = () =>
    NextResponse.redirect(`${origin}/login?error=Invalid or expired token`);

  const supabase = await createClient();
  let user: User | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fallar();
    user = data.user;
  } else if (tokenHash && esTipoOtp(type)) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) return fallar();
    user = data.user;
  } else {
    return fallar();
  }

  if (!user) return fallar();

  const isAdmin = user.app_metadata?.role === "admin";
  const destination = !explicitNext && isAdmin ? "/admin" : next;

  return NextResponse.redirect(`${origin}${destination}`);
}
