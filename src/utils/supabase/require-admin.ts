import { createClient } from "@/utils/supabase/server";

export async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  if (user.app_metadata?.role !== "admin") throw new Error("Forbidden");
}
