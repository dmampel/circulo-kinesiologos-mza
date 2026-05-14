import { notFound } from "next/navigation";
import { NoticiaRepository } from "@/lib/repositories/NoticiaRepository";
import EditarNoticiaForm from "./EditarNoticiaForm";

export default async function EditarNoticiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const noticia = await NoticiaRepository.getById(id);

  if (!noticia) notFound();

  return <EditarNoticiaForm noticia={noticia} />;
}
