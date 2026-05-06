import KineClubClient from "./KineClubClient";
import { BeneficioRepository } from "@/lib/repositories/BeneficioRepository";
import { CategoriaRepository } from "@/lib/repositories/CategoriaRepository";
import { kineClubSearchSchema } from "@/lib/validations/searchParams";

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
