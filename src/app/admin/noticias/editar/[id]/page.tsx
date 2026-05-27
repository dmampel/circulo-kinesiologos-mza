import { notFound } from "next/navigation";
import { NoticiaRepository } from "@/lib/repositories/NoticiaRepository";
import { CategoriaNoticiaRepository } from "@/lib/repositories/CategoriaNoticiaRepository";
import EditarNoticiaForm from "./EditarNoticiaForm";

export const dynamic = "force-dynamic";

export default async function EditarNoticiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [noticia, categorias] = await Promise.all([
    NoticiaRepository.getById(id),
    CategoriaNoticiaRepository.getAll(),
  ]);

  if (!noticia) notFound();

  return <EditarNoticiaForm noticia={noticia} categorias={categorias} />;
}
