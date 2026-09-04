"use server";

import { createClient } from "@/utils/supabase/server";
import { construirUrlAbsoluta } from "@/lib/site";
import { codigoDeErrorDeContrasena } from "@/lib/auth-errores";
import {
  CLAVE_ACTIVACION,
  CLAVE_ORIGEN_ACTIVACION,
  activacionCompletada,
} from "@/lib/activacion";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { data: { user }, error } = await supabase.auth.signInWithPassword(data);

  if (error || !user) {
    redirect("/login?error=credenciales_invalidas");
  }

  revalidatePath("/", "layout");

  if (user.app_metadata?.role === "admin") {
    redirect("/admin");
  }

  redirect("/mi-panel");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/login?error=registro_fallido");
  }

  revalidatePath("/", "layout");
  redirect("/login?message=revisar_email");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  // La URL debe ser ABSOLUTA y estar en la lista de Redirect URLs de Supabase.
  // Antes se armaba con el header `origin`, que no siempre llega: cuando venia
  // vacio el `redirectTo` quedaba relativo, Supabase lo descartaba y caia al
  // Site URL del proyecto. Se usa la misma fuente de verdad que el sitemap.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: construirUrlAbsoluta("auth/callback?next=/auth/set-password"),
  });

  if (error) {
    redirect("/forgot-password?error=mail_no_enviado");
  }

  redirect("/forgot-password?message=sent");
}

/**
 * Metadata de activación a escribir junto con la contraseña, o `null` si la
 * cuenta ya está marcada.
 *
 * Idempotencia (design D1): se lee el usuario ANTES de escribir para no pisar
 * la fecha de activación original cuando un socio que ya activó cambia su
 * contraseña desde el flujo de recuperación. `activacion_origen` viaja con la
 * fecha y no se toca por separado, para que no queden una fecha de backfill
 * con origen "usuario".
 *
 * Si la lectura falla se escribe igual: perder fidelidad en la métrica es
 * preferible a no marcar la activación y dejar al socio afuera del portal.
 */
async function datosDeActivacion(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Record<string, string> | null> {
  try {
    const { data } = await supabase.auth.getUser();
    if (activacionCompletada(data.user)) return null;
  } catch {
    // Sin dato confiable, se marca. Ver arriba.
  }

  return {
    [CLAVE_ACTIVACION]: new Date().toISOString(),
    [CLAVE_ORIGEN_ACTIVACION]: "usuario",
  };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  const data = await datosDeActivacion(supabase);

  // UNA sola llamada (design D1). La contraseña y la marca de activación se
  // escriben juntas contra el servidor de Auth: partirlo en dos operaciones
  // reintroduce exactamente el estado a medio camino que este flujo viene a
  // eliminar — cuenta viva, con sesión, sin contraseña y figurando activa.
  // Por eso la marca va en `user_metadata` y no en `app_metadata`, que sólo se
  // escribe con service role y obligaría a una segunda llamada.
  const { error } = await supabase.auth.updateUser({
    password: password,
    ...(data ? { data } : {}),
  });

  // Antes acá salía siempre el mismo "Could not update password", y la pantalla
  // ni lo pintaba: el socio veía la página recargarse igual y creía que el
  // sistema lo rechazaba porque sí. Se manda un CÓDIGO y /auth/set-password lo
  // traduce; el texto crudo de Supabase no viaja por la URL.
  //
  // Si `updateUser` falla, NO queda escritura parcial: contraseña y marca eran
  // la misma operación, así que o entraron las dos o no entró ninguna. La marca
  // no se escribe por ningún otro camino del código.
  if (error) {
    redirect(`/auth/set-password?error=${codigoDeErrorDeContrasena(error)}`);
  }

  revalidatePath("/", "layout");
  redirect("/mi-panel");
}
