"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { CircularRepository } from "@/lib/repositories/CircularRepository";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";

/**
 * Registra que un profesional ha leído una circular específica.
 */
export async function registrarLecturaAction(circularId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  try {
    // Obtenemos el perfil del profesional vinculado al usuario de auth
    const profesional = await ProfesionalRepository.findByUserId(user.id);
    
    if (!profesional) {
      return { success: false, error: "Perfil de profesional no encontrado" };
    }

    // Guardamos el registro de lectura
    await CircularRepository.markAsRead(circularId, profesional.id);
    
    // Revalidamos el layout del panel para que se actualicen los badges de notificaciones
    // y la página de lista de circulares.
    revalidatePath("/mi-panel", "layout");
    revalidatePath("/mi-panel/circulares");
    
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo registrar la lectura." };
  }
}
