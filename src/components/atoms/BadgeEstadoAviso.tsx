import { cn } from "@/lib/utils";
import type { EstadoAviso } from "@prisma/client";

const ESTILOS: Record<EstadoAviso, string> = {
  PENDIENTE: "bg-orange-100 text-orange-600",
  PUBLICADO: "bg-green-100 text-green-600",
  RECHAZADO: "bg-red-100 text-red-600",
  ARCHIVADO: "bg-slate-200 text-slate-500",
};

/** Mismo estilo de badge que `/admin/solicitudes` (`design.md — D8`, `tasks.md — 5.4`). */
export default function BadgeEstadoAviso({ estado }: { estado: EstadoAviso }) {
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase", ESTILOS[estado])}>
      {estado}
    </span>
  );
}
