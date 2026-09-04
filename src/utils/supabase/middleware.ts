import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { requiereActivacion } from "@/lib/activacion";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isMiPanelRoute = request.nextUrl.pathname.startsWith("/mi-panel");

  if (!user && (isAdminRoute || isMiPanelRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAdminRoute && user.app_metadata?.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/mi-panel";
    return NextResponse.redirect(url);
  }

  // Guard de activación. Un socio que abrió el link del mail tiene sesión, pero
  // no necesariamente contraseña propia: si lo dejamos entrar al portal, cuando
  // esa sesión se le venza queda afuera sin que nadie se entere. Se lo devuelve
  // a terminar el paso que le falta.
  //
  // EL ORDEN IMPORTA: esto va DESPUÉS de "sin sesión → /login". Un visitante
  // anónimo mandado a /auth/set-password aterriza en una pantalla sin sesión que
  // actualizar, donde lo único que puede cosechar es `sesion_vencida`.
  // (`requiereActivacion(null)` devuelve false, así que la condición es doblemente
  // segura, pero el orden es la garantía real.)
  //
  // Sin ciclo: /auth/set-password no empieza con /mi-panel, así que no vuelve a
  // caer acá. Los admin están exentos (ver `requiereActivacion`): su flujo nunca
  // escribe la marca y trabarlos sería bloquear la cuenta de mayor privilegio.
  //
  // `getUser()` valida contra el servidor de Auth —ya se llamaba arriba, el guard
  // no agrega una sola request—, así que devuelve el `user_metadata` fresco: el
  // socio que acaba de activar entra en la misma navegación.
  if (isMiPanelRoute && requiereActivacion(user)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/set-password";
    // La query de /mi-panel no significa nada en la pantalla de activación, y
    // arrastrarla dejaría pasar un `?error=` puesto a mano en un link.
    url.search = "";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but remember that it should return a response.
  // If not, you can get stuck in a redirect loop.

  return supabaseResponse;
}
