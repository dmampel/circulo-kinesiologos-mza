import type { Metadata } from "next";
import KineClubClient from "./KineClubClient";
import { BeneficioRepository } from "@/lib/repositories/BeneficioRepository";
import { CategoriaRepository } from "@/lib/repositories/CategoriaRepository";
import { kineClubSearchSchema } from "@/lib/validations/searchParams";

export const metadata: Metadata = {
  title: "KineClub — Beneficios para Socios | CKM Mendoza",
  description: "Descubrí los descuentos y beneficios exclusivos para socios del Círculo de Kinesiólogos de Mendoza: farmacias, clínicas, librerías y más.",
  openGraph: {
    title: "KineClub | CKM Mendoza",
    description: "Beneficios y descuentos exclusivos para socios del Círculo de Kinesiólogos de Mendoza.",
    url: "https://www.circulokinesiologos.com.ar/kineclub",
  },
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function KineClubPage({ searchParams }: Props) {
  const params = kineClubSearchSchema.parse(await searchParams);
  const { cat: currentCat } = params;

  const [beneficios, categoriasDb] = await Promise.all([
    BeneficioRepository.getAll(currentCat),
    CategoriaRepository.getAll()
  ]);

  const categorias = [
    { id: "TODOS", name: "Todos", iconName: "Sparkles", color: "blue" },
    ...categoriasDb.map(cat => ({
      id: cat.slug,
      name: cat.nombre,
      iconName: cat.icono || "Tag",
      color: cat.color || "slate"
    }))
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <KineClubClient 
        beneficios={beneficios as any} 
        currentCat={currentCat} 
        categorias={categorias}
      />
    </div>
  );
}
