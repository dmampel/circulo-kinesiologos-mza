import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LocalidadRepository } from "@/lib/repositories/LocalidadRepository";
import FormBuscoKinesiologo from "@/components/organisms/FormBuscoKinesiologo";
import AclaracionLegal from "@/components/atoms/AclaracionLegal";

export const metadata: Metadata = {
  title: "Publicar que busco kinesiólogo | Bolsa de Trabajo | CKM Mendoza",
};

export default async function PublicarBuscoKinesiologoPage() {
  const localidades = await LocalidadRepository.getAll();

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/bolsa-de-trabajo"
          className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la Bolsa de Trabajo
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Publicá que <span className="text-blue-600">buscás un kinesiólogo</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
            Contanos la propuesta laboral. El aviso pasa por una revisión del Círculo antes de publicarse.
          </p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 p-8 lg:p-12 border border-slate-50 mb-8">
          <FormBuscoKinesiologo localidades={localidades} />
        </div>

        <AclaracionLegal />
      </div>
    </div>
  );
}
