"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

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

  // Verificar si es un profesional vinculado
  const { ProfesionalRepository } = await import("@/lib/repositories/ProfesionalRepository");
  const profesional = await ProfesionalRepository.findByUserId(user.id);

  revalidatePath("/", "layout");

  if (profesional?.role === "ADMIN") {
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
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/set-password`,
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

  if (error) {
    redirect("/auth/set-password?error=Could not update password");
  }

  revalidatePath("/", "layout");
  redirect("/mi-panel");
}
