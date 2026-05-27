import prisma from "@/lib/prisma";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Briefcase,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import BotonesSolicitud from "../BotonesSolicitud";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalleSolicitudPage({ params }: Props) {
  const { id } = await params;
  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
  });

  if (!solicitud) notFound();

  const datos = solicitud.datos as any;
  const archivos = datos?.archivos || {};
  
  const SUPABASE_STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/solicitudes`;

  const DOCS = [
    { id: "dni", label: "Fotocopia DNI", file: archivos.dni },
    { id: "titulo", label: "Título Universitario", file: archivos.titulo },
    { id: "cuit", label: "Constancia CUIT/IIBB", file: archivos.cuit },
    { id: "seguro", label: "Póliza Mala Praxis", file: archivos.seguro },
    { id: "cv", label: "Curriculum Vitae", file: archivos.cv },
    { id: "matricula_file", label: "Matrícula Provincial", file: archivos.matricula_file },
    { id: "super_salud", label: "Superintendencia de Salud", file: archivos.super_salud },
    { id: "habilitacion", label: "Habilitación Consultorio", file: archivos.habilitacion },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin/solicitudes" 
            className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:shadow-md transition-all"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">
              {solicitud.nombre} {solicitud.apellido}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                solicitud.status === "PENDIENTE" ? "bg-orange-100 text-orange-600" :
                solicitud.status === "APROBADA" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              )}>
                {solicitud.status}
              </span>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-tight flex items-center">
                <Clock className="h-3 w-3 mr-1" /> Recibida el {new Date(solicitud.creada_en).toLocaleDateString("es-AR")}
              </span>
            </div>
          </div>
        </div>
        
        <BotonesSolicitud id={solicitud.id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Datos */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Información Personal */}
          <section className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center">
              <User className="mr-3 h-6 w-6 text-blue-600" /> Datos del Profesional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email de Contacto</p>
                <div className="flex items-center text-slate-900 font-bold">
                  <Mail className="h-4 w-4 mr-2 text-slate-400" /> {solicitud.email}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DNI / CUIL</p>
                <div className="flex items-center text-slate-900 font-bold text-lg">
                  <ShieldCheck className="h-4 w-4 mr-2 text-slate-400" /> {datos?.dni || "No especificado"}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula Profesional</p>
                <div className="flex items-center text-blue-600 font-black text-xl">
                  <Briefcase className="h-5 w-5 mr-2" /> M.P. {solicitud.matricula}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialidad</p>
                <div className="flex items-center text-slate-900 font-bold">
                  <ShieldCheck className="h-4 w-4 mr-2 text-slate-400" /> {datos?.especialidad || "General"}
                </div>
              </div>
              <div className="col-span-full space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección de Consultorio</p>
                <div className="flex items-center text-slate-900 font-bold">
                  <MapPin className="h-4 w-4 mr-2 text-slate-400" /> {datos?.direccion || "No especificada"}
                </div>
              </div>
            </div>
          </section>

          {/* Documentación Adjunta */}
          <section className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center">
              <FileText className="mr-3 h-6 w-6 text-blue-600" /> Documentación Digital
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOCS.map((doc) => (
                <div 
                  key={doc.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex items-center justify-between",
                    doc.file ? "bg-slate-50 border-slate-100" : "bg-red-50/30 border-red-50 border-dashed opacity-60"
                  )}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      doc.file ? "bg-white text-blue-600 shadow-sm" : "bg-slate-100 text-slate-400"
                    )}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{doc.label}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {doc.file ? "Disponible" : "No adjuntado"}
                      </p>
                    </div>
                  </div>
                  
                  {doc.file && (
                    <div className="flex items-center space-x-2">
                      <a 
                        href={`${SUPABASE_STORAGE_URL}/${doc.file}`}
                        target="_blank"
                        className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-sm transition-all"
                        title="Ver online"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <a 
                        href={`${SUPABASE_STORAGE_URL}/${doc.file}`}
                        download
                        className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 hover:shadow-md transition-all"
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Columna Derecha: Resumen / Estado */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Estado del Trámite</h4>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Solicitud Recibida</p>
                  <p className="text-[10px] text-slate-400">{new Date(solicitud.creada_en).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">En Revisión</p>
                  <p className="text-[10px] text-slate-400">Pendiente de validación de archivos.</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  "Al aprobar, el profesional se habilitará automáticamente en el padrón y recibirá sus credenciales por email."
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm text-center">
            <div className="h-16 w-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <h4 className="font-black text-slate-900">Fecha de Registro</h4>
            <p className="text-sm text-slate-500 mt-1">{new Date(solicitud.creada_en).toLocaleDateString("es-AR", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
