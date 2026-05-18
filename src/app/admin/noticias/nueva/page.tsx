import { CategoriaNoticiaRepository } from "@/lib/repositories/CategoriaNoticiaRepository";
import NuevaNoticiaForm from "./NuevaNoticiaForm";

export default async function NuevaNoticiaPage() {
  const categorias = await CategoriaNoticiaRepository.getAll();
  return <NuevaNoticiaForm categorias={categorias} />;
}
