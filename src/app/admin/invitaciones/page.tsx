import Link from "next/link";
import {
  Users,
  Send,
  UserCheck,
  Clock,
  MailQuestion,
  MailX,
  MailWarning,
  KeyRound,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InvitacionRepository,
  type EstadoInvitacion,
  type InvitacionProfesional,
} from "@/lib/repositories/InvitacionRepository";
import AdminSearch from "../_components/AdminSearch";
import BotonReenviar from "./BotonReenviar";
import BotonActualizar from "./BotonActualizar";

// El resumen se cruza en vivo contra Supabase Auth: nunca se cachea.
export const dynamic = "force-dynamic";

/** Cuántas filas se pintan de una. Sin tope, el padrón entero es un HTML enorme. */
const MAXIMO_DE_FILAS = 200;

const ESTADOS: Record<
  EstadoInvitacion,
  { etiqueta: string; clases: string; ayuda: string }
> = {
  ACTIVADO: {
    etiqueta: "Activado",
    clases: "bg-emerald-100 text-emerald-700",
    ayuda: "Definió su contraseña: la cuenta ya es suya y puede volver a entrar cuando quiera.",
  },
  // Naranja: "necesita una acción del socio". Convive con el ámbar de EN_LIMBO
  // sin chocar con el rojo de HUERFANO, que es un problema de datos, no de gente.
  SIN_CONTRASENA: {
    etiqueta: "Sin contraseña",
    clases: "bg-orange-100 text-orange-700",
    ayuda: "Entró por el link pero nunca guardó su contraseña. No va a poder volver a entrar.",
  },
  EN_LIMBO: {
    etiqueta: "En limbo",
    clases: "bg-amber-100 text-amber-700",
    ayuda: "La invitación salió, pero nunca entró. Son los que hay que perseguir.",
  },
  SIN_INVITAR: {
    etiqueta: "Sin invitar",
    clases: "bg-blue-100 text-blue-700",
    ayuda: "Tiene email cargado, todavía no se le mandó nada.",
  },
  SIN_EMAIL: {
    etiqueta: "Sin email",
    clases: "bg-slate-100 text-slate-500",
    ayuda: "No se puede invitar hasta cargarle un email.",
  },
  HUERFANO: {
    etiqueta: "Huérfano",
    clases: "bg-red-100 text-red-600",
    ayuda: "Apunta a una cuenta de Auth que ya no existe. Reenviar no lo arregla.",
  },
};

const formatearFecha = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

/** Hora del recálculo, siempre en huso de Mendoza para no depender del cliente. */
const formatearHora = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Mendoza",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const formatearDia = (dia: string) => {
  const [anio, mes, day] = dia.split("-");
  return `${day}/${mes}/${anio}`;
};

function coincide(profesional: InvitacionProfesional, busqueda: string) {
  if (!busqueda) return true;
  const termino = busqueda.toLowerCase();
  return [
    profesional.apellido,
    profesional.nombre,
    profesional.matricula,
    profesional.email ?? "",
  ].some((campo) => campo.toLowerCase().includes(termino));
}

export default async function InvitacionesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q, estado } = await searchParams;
  const busqueda = q?.trim() ?? "";
  const filtro = (estado && estado in ESTADOS ? estado : null) as EstadoInvitacion | null;

  const resumen = await InvitacionRepository.getResumen();

  const filtradas = resumen.profesionales.filter(
    (profesional) =>
      (!filtro || profesional.estado === filtro) && coincide(profesional, busqueda)
  );
  const visibles = filtradas.slice(0, MAXIMO_DE_FILAS);

  const metricas = [
    { name: "Padrón", value: resumen.total, icon: Users, color: "text-slate-500", estado: null },
    { name: "Invitados", value: resumen.invitados, icon: Send, color: "text-blue-600", estado: null },
    { name: "Activados", value: resumen.activados, icon: UserCheck, color: "text-emerald-600", estado: "ACTIVADO" },
    { name: "Sin contraseña", value: resumen.sinContrasena, icon: KeyRound, color: "text-orange-600", estado: "SIN_CONTRASENA" },
    { name: "En limbo", value: resumen.enLimbo, icon: Clock, color: "text-amber-600", estado: "EN_LIMBO" },
    { name: "Sin invitar", value: resumen.sinInvitar, icon: MailQuestion, color: "text-blue-500", estado: "SIN_INVITAR" },
    { name: "Sin email", value: resumen.sinEmail, icon: MailX, color: "text-slate-400", estado: "SIN_EMAIL" },
    { name: "Huérfanos", value: resumen.huerfanos, icon: MailWarning, color: resumen.huerfanos > 0 ? "text-red-500" : "text-slate-300", estado: "HUERFANO" },
  ] as const;

  const activacion = resumen.invitados
    ? Math.round((resumen.activados / resumen.invitados) * 100)
    : 0;

  const linkConFiltro = (nuevoEstado: EstadoInvitacion | null) => {
    const params = new URLSearchParams();
    if (busqueda) params.set("q", busqueda);
    if (nuevoEstado) params.set("estado", nuevoEstado);
    const query = params.toString();
    return query ? `/admin/invitaciones?${query}` : "/admin/invitaciones";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Invitaciones</h1>
          <p className="text-slate-500 font-medium">
            Estado real de la activación de cuentas, cruzado en vivo contra Auth.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminSearch placeholder="Buscar por nombre, matrícula o email..." />
          <BotonActualizar actualizadoEl={formatearHora(resumen.generadoEl)} />
        </div>
      </div>

      {/* Métricas — cada una es un filtro */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-4 border-b border-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Estado de la activación
          </p>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            {activacion}% de los invitados ya activó su cuenta
          </p>
        </div>
        {/* Con la tarjeta nueva son ocho: en el celular van de a dos (a cuatro,
            el número y la etiqueta quedaban apretados contra el borde) y recién
            en xl entran las ocho en una sola fila. Sin anchos fijos: la escala
            de columnas hace todo el trabajo. */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 divide-x divide-slate-50">
          {metricas.map((metrica) => {
            const activo = filtro === metrica.estado && metrica.estado !== null;
            return (
              <Link
                key={metrica.name}
                href={linkConFiltro(metrica.estado)}
                className={cn(
                  "py-7 px-4 flex flex-col items-center gap-2 group transition-all",
                  activo ? "bg-slate-50" : "hover:bg-slate-50/70"
                )}
              >
                <metrica.icon
                  className={cn("h-5 w-5 transition-transform group-hover:scale-110", metrica.color)}
                />
                <p className="text-3xl font-black text-slate-900 tabular-nums">{metrica.value}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  {metrica.name}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tandas: una fila por día de envío */}
      {resumen.tandas.length > 0 && (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3">
            <h3 className="font-black text-slate-900">Tandas de envío</h3>
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-black">
              {resumen.tandas.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invitados</th>
                  {/* Antes decía "Entraron". Ahora la columna cuenta a los que
                      definieron su contraseña, que es otra cosa. */}
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activaron</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">En limbo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {resumen.tandas.map((tanda) => (
                  <tr key={tanda.fecha} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-slate-900 flex items-center">
                        <Calendar className="mr-2 h-3.5 w-3.5 text-slate-300" />
                        {formatearDia(tanda.fecha)}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-600 tabular-nums">{tanda.invitados}</td>
                    <td className="px-8 py-5 text-sm font-bold text-emerald-600 tabular-nums">{tanda.entraron}</td>
                    <td className="px-8 py-5 text-sm font-bold text-amber-600 tabular-nums">{tanda.enLimbo}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${tanda.porcentaje}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-500 tabular-nums">
                          {tanda.porcentaje}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detalle por profesional */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex flex-wrap items-center gap-3">
          <h3 className="font-black text-slate-900">
            {filtro ? ESTADOS[filtro].etiqueta : "Todo el padrón"}
          </h3>
          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-black">
            {filtradas.length}
          </span>
          {filtro && (
            <>
              <p className="text-xs font-medium text-slate-400">{ESTADOS[filtro].ayuda}</p>
              <Link
                href={linkConFiltro(null)}
                className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
              >
                Quitar filtro
              </Link>
            </>
          )}
        </div>

        {filtradas.length === 0 ? (
          <div className="p-20 text-center">
            <div className="mx-auto h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <MailQuestion className="h-10 w-10 text-slate-300" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">Sin resultados</h4>
            <p className="text-slate-500">Probá con otro filtro o con otra búsqueda.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profesional</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invitado</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Último ingreso</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visibles.map((profesional) => (
                    <tr key={profesional.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <Link
                          href={`/admin/profesionales/${profesional.id}`}
                          className="block group/item"
                        >
                          <p className="font-black text-slate-900 group-hover/item:text-blue-600 transition-colors">
                            {profesional.apellido}, {profesional.nombre}
                          </p>
                          <p className="text-xs text-slate-400">
                            {profesional.email ?? "sin email cargado"}
                          </p>
                        </Link>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-600">M.P. {profesional.matricula}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase whitespace-nowrap",
                            ESTADOS[profesional.estado].clases
                          )}
                        >
                          {ESTADOS[profesional.estado].etiqueta}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider tabular-nums">
                        {formatearFecha(profesional.invitadoEl)}
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider tabular-nums">
                        {formatearFecha(profesional.ultimoIngreso)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        {/* `reenviarInvitacion` sirve igual para los dos: regenera
                            el token de una identidad que ya existe, que es la
                            situación tanto del que nunca entró como del que entró
                            y no guardó contraseña. */}
                        {profesional.estado === "EN_LIMBO" ||
                        profesional.estado === "SIN_CONTRASENA" ? (
                          <BotonReenviar id={profesional.id} />
                        ) : (
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtradas.length > visibles.length && (
              <div className="px-8 py-5 border-t border-slate-50 text-center">
                <p className="text-xs font-bold text-slate-400">
                  Mostrando {visibles.length} de {filtradas.length}. Afiná con el buscador o con un filtro.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
