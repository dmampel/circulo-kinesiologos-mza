"use server";

import { revalidatePath } from "next/cache";
import type { EstadoAviso } from "@prisma/client";
import { requireAdmin } from "@/utils/supabase/require-admin";
import { AvisoRepository } from "@/lib/repositories/AvisoRepository";

type ActionResult = { success: boolean; error?: string };
type TipoAviso = "busco-trabajo" | "busco-kinesiologo";

/**
 * Cambia el estado de un aviso (aprobar / rechazar / archivar) desde la
 * bandeja de moderación (`design.md — D6`, `tasks.md — 5.3`). Contrato
 * `{ success, error? }` (AGENTS.md) y `revalidatePath` de la sección pública
 * para que la aprobación se refleje sin esperar la próxima recarga natural
 * de caché.
 */
export async function cambiarEstadoAviso(tipo: TipoAviso, id: string, estado: EstadoAviso): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (tipo === "busco-trabajo") {
      await AvisoRepository.actualizarEstadoBuscoTrabajo(id, estado);
    } else {
      await AvisoRepository.actualizarEstadoBuscoKinesiologo(id, estado);
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el aviso.";
    return { success: false, error: message };
  } finally {
    revalidatePath("/admin/bolsa-de-trabajo");
    revalidatePath("/bolsa-de-trabajo");
  }
}
