import { SorteoRepository } from "@/lib/repositories/SorteoRepository";
import { notFound } from "next/navigation";
import EditarSorteoForm from "./EditarSorteoForm";

export const dynamic = "force-dynamic";

export default async function EditarSorteoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sorteo = await SorteoRepository.findById(id);

  if (!sorteo) notFound();

  return <EditarSorteoForm sorteo={sorteo} />;
}
