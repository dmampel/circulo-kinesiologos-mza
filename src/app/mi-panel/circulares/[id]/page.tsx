import { createClient } from "@/utils/supabase/server";
import { CircularRepository } from "@/lib/repositories/CircularRepository";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ReadTracker } from "./ReadTracker";
import { ArrowLeft, ExternalLink, FileText, Image as ImageIcon, File } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function getFileType(url: string): "pdf" | "image" | "other" {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || ""))
    return "image";
  return "other";
}

export default async function CircularDetallePage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const circular = await CircularRepository.getPublishedById(id);

  if (!circular) {
    notFound();
  }

  const fechaFormateada = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(circular.publicada_en || circular.createdAt);

  const tieneContenido = circular.contenido && circular.contenido.trim().length > 0;
  const tieneArchivo = Boolean(circular.archivo_url);
  const fileType = circular.archivo_url ? getFileType(circular.archivo_url) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16 animate-in fade-in duration-500">
      <ReadTracker circularId={id} />
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 pt-2">
        <Link
          href="/mi-panel/circulares"
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Circulares
        </Link>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-block text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
            {circular.etiqueta}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {fechaFormateada}
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
          {circular.titulo}
        </h1>
        {tieneContenido && (
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm font-medium pt-1">
            {circular.contenido}
          </p>
        )}
        {!tieneContenido && !tieneArchivo && (
          <p className="text-slate-400 text-sm font-medium italic">
            Esta circular no tiene contenido adjunto.
          </p>
        )}
      </div>

      {/* File preview */}
      {tieneArchivo && (
        <div className="space-y-3">
          {/* PDF embed */}
          {fileType === "pdf" && (
            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                  Archivo adjunto · PDF
                </div>
                <a
                  href={circular.archivo_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Abrir en nueva pestaña
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <iframe
                src={circular.archivo_url!}
                className="w-full"
                style={{ height: "72vh", minHeight: "400px" }}
                title={circular.titulo}
              />
            </div>
          )}

          {/* Image preview */}
          {fileType === "image" && (
            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                  Imagen adjunta
                </div>
                <a
                  href={circular.archivo_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Ver original
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={circular.archivo_url!}
                alt={circular.titulo}
                className="w-full object-contain max-h-[60vh]"
              />
            </div>
          )}

          {/* Other file types — only the download button */}
          {fileType === "other" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <File className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Archivo adjunto</p>
                  <p className="text-xs text-slate-400 font-medium">
                    {circular.archivo_url!.split("/").pop()?.split("?")[0] ?? "archivo"}
                  </p>
                </div>
              </div>
              <a
                href={circular.archivo_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-100 shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
