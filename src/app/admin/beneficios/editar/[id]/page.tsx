import { notFound } from "next/navigation";
import EditBeneficioForm from "./EditBeneficioForm";
import { BeneficioRepository } from "@/lib/repositories/BeneficioRepository";
import { CategoriaRepository } from "@/lib/repositories/CategoriaRepository";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarBeneficioPage({ params }: Props) {
  const { id } = await params;

  const [beneficio, categorias] = await Promise.all([
    BeneficioRepository.getById(id),
    CategoriaRepository.getAll(),
  ]);

  if (!beneficio) {
    notFound();
  }

  return <EditBeneficioForm beneficio={beneficio} categorias={categorias} />;
}
