"use server";

import { createClient } from "@/utils/supabase/server";
import { construirUrlAbsoluta } from "@/lib/site";
import { codigoDeErrorDeContrasena } from "@/lib/auth-errores";
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
    redirect("/login?error=Could not authenticate user");
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
    redirect("/login?error=Could not authenticate user");
  }

  revalidatePath("/", "layout");
  redirect("/login?message=Check your email to confirm your account");
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
    redirect("/forgot-password?error=No se pudo enviar el correo. Intentá de nuevo.");
  }

  redirect("/forgot-password?message=sent");
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  // Antes acá salía siempre el mismo "Could not update password", y la pantalla
  // ni lo pintaba: el socio veía la página recargarse igual y creía que el
  // sistema lo rechazaba porque sí. Se manda un CÓDIGO y /auth/set-password lo
  // traduce; el texto crudo de Supabase no viaja por la URL.
  if (error) {
    redirect(`/auth/set-password?error=${codigoDeErrorDeContrasena(error)}`);
  }

  revalidatePath("/", "layout");
  redirect("/mi-panel");
}
