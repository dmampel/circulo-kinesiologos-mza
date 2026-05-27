import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditBeneficioForm from "./EditBeneficioForm";
import { CategoriaRepository } from "@/lib/repositories/CategoriaRepository";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarBeneficioPage({ params }: Props) {
  const { id } = await params;

  const [beneficio, categorias] = await Promise.all([
    prisma.beneficioKineClub.findUnique({
      where: { id },
    }),
    CategoriaRepository.getAll()
  ]);

  if (!beneficio) {
    notFound();
  }

  return (
    <EditBeneficioForm 
      beneficio={beneficio as any} 
      categorias={categorias} 
    />
  );
}
