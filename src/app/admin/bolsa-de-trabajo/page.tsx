import { Briefcase, Building2, FileText, Mail, Phone, MapPin, Bell } from "lucide-react";
import { AvisoRepository } from "@/lib/repositories/AvisoRepository";
import { firmarCv } from "@/lib/storage/bolsaTrabajo";
import BadgeEstadoAviso from "@/components/atoms/BadgeEstadoAviso";
import BotonesAviso from "./BotonesAviso";
import TabsBolsa from "@/components/molecules/TabsBolsa";

export const dynamic = "force-dynamic";

type Tipo = "busco-trabajo" | "busco-kinesiologo";

interface Props {
  searchParams: Promise<{ tipo?: string }>;
}

/**
 * Bandeja de moderación (`design.md — D6`, `tasks.md — 5.1/5.2`). La
 * protección de sesión de admin vive en `src/app/admin/layout.tsx` (guard
 * server-side compartido por todo `/admin`) — no hace falta repetirla acá.
 */
export default async function BolsaDeTrabajoAdminPage({ searchParams }: Props) {
  const { tipo: tipoParam } = await searchParams;
  const tipo: Tipo = tipoParam === "busco-kinesiologo" ? "busco-kinesiologo" : "busco-trabajo";

  const [avisosTrabajo, avisosKinesiologo, pendientes] = await Promise.all([
    tipo === "busco-trabajo" ? AvisoRepository.findAllBuscoTrabajo() : Promise.resolve(null),
    tipo === "busco-kinesiologo" ? AvisoRepository.findAllBuscoKinesiologo() : Promise.resolve(null),
    AvisoRepository.countPendientes(),
  ]);

  const cvUrls = avisosTrabajo
    ? Object.fromEntries(
        await Promise.all(
          avisosTrabajo
            .filter((a) => a.cvPath)
            .map(async (a) => [a.id, await firmarCv(a.cvPath!)] as const),
        ),
      )
    : {};

  const totalPendientes = pendientes.trabajo + pendientes.kinesiologo;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
            Bolsa de Trabajo
            {totalPendientes > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-black">
                <Bell className="h-3 w-3" /> {totalPendientes} pendiente{totalPendientes !== 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p className="text-slate-500 font-medium">
            Revisá, aprobá, rechazá o archivá los avisos publicados por kinesiólogos e instituciones.
          </p>
        </div>
        <TabsBolsa basePath="/admin/bolsa-de-trabajo" tipo={tipo} />
      </div>

      {tipo === "busco-trabajo" && avisosTrabajo && (
        <TablaAvisosTrabajo avisos={avisosTrabajo} cvUrls={cvUrls} />
      )}
      {tipo === "busco-kinesiologo" && avisosKinesiologo && (
        <TablaAvisosKinesiologo avisos={avisosKinesiologo} />
      )}
    </div>
  );
}

function TablaAvisosTrabajo({
  avisos,
  cvUrls,
}: {
  avisos: Awaited<ReturnType<typeof AvisoRepository.findAllBuscoTrabajo>>;
  cvUrls: Record<string, string | null>;
}) {
  if (avisos.length === 0) {
    return <EstadoVacio icono={Briefcase} mensaje="No hay avisos de kinesiólogos que busquen trabajo." />;
  }

  return (
    <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3">
        <h3 className="font-black text-slate-900">Busco trabajo</h3>
        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-black">{avisos.length}</span>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-50">
            <Th>Kinesiólogo</Th>
            <Th>Contacto</Th>
            <Th>Localidad</Th>
            <Th>Estado</Th>
            <Th align="right">Acciones</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {avisos.map((aviso) => (
            <tr key={aviso.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-8 py-6">
                <p className="font-black text-slate-900">
                  {aviso.apellido}, {aviso.nombre}
                </p>
                <p className="text-xs text-slate-400">M.P. {aviso.matricula} · {aviso.especialidad.nombre}</p>
              </td>
              <td className="px-8 py-6 space-y-1">
                <p className="text-xs text-slate-500 flex items-center"><Mail className="mr-1.5 h-3 w-3" /> {aviso.email}</p>
                <p className="text-xs text-slate-500 flex items-center"><Phone className="mr-1.5 h-3 w-3" /> {aviso.telefono}</p>
                {cvUrls[aviso.id] ? (
                  <a
                    href={cvUrls[aviso.id]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-600 flex items-center hover:underline"
                  >
                    <FileText className="mr-1.5 h-3 w-3" /> Ver CV
                  </a>
                ) : null}
              </td>
              <td className="px-8 py-6">
                <p className="text-xs font-bold text-slate-600 flex items-center">
                  <MapPin className="mr-1.5 h-3 w-3 text-slate-300" /> {aviso.localidad.nombre}
                </p>
              </td>
              <td className="px-8 py-6">
                <BadgeEstadoAviso estado={aviso.estado} />
              </td>
              <td className="px-8 py-6">
                <BotonesAviso tipo="busco-trabajo" id={aviso.id} estado={aviso.estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TablaAvisosKinesiologo({
  avisos,
}: {
  avisos: Awaited<ReturnType<typeof AvisoRepository.findAllBuscoKinesiologo>>;
}) {
  if (avisos.length === 0) {
    return <EstadoVacio icono={Building2} mensaje="No hay avisos de instituciones que busquen kinesiólogos." />;
  }

  return (
    <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3">
        <h3 className="font-black text-slate-900">Busco kinesiólogo</h3>
        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-black">{avisos.length}</span>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-50">
            <Th>Institución</Th>
            <Th>Medio de contacto</Th>
            <Th>Localidad</Th>
            <Th>Estado</Th>
            <Th align="right">Acciones</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {avisos.map((aviso) => (
            <tr key={aviso.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-8 py-6">
                <p className="font-black text-slate-900">{aviso.institucion}</p>
                <p className="text-xs text-slate-400">{aviso.tipoPuesto} · {aviso.area}</p>
              </td>
              <td className="px-8 py-6">
                <p className="text-xs text-slate-500">{aviso.medioContacto}</p>
              </td>
              <td className="px-8 py-6">
                <p className="text-xs font-bold text-slate-600 flex items-center">
                  <MapPin className="mr-1.5 h-3 w-3 text-slate-300" /> {aviso.localidad.nombre}
                </p>
              </td>
              <td className="px-8 py-6">
                <BadgeEstadoAviso estado={aviso.estado} />
              </td>
              <td className="px-8 py-6">
                <BotonesAviso tipo="busco-kinesiologo" id={aviso.id} estado={aviso.estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      className={`px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest ${align === "right" ? "text-right" : ""}`}
    >
      {children}
    </th>
  );
}

function EstadoVacio({ icono: Icono, mensaje }: { icono: React.ComponentType<{ className?: string }>; mensaje: string }) {
  return (
    <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-slate-200">
      <div className="mx-auto h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
        <Icono className="h-10 w-10 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Sin avisos</h3>
      <p className="text-slate-500">{mensaje}</p>
    </div>
  );
}
