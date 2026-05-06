import { Ticket, ShoppingBag, Coffee, Plane, Heart, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import KineClubClient from "./KineClubClient";

const CATEGORIAS = [
  { id: "TODOS", name: "Todos", icon: Sparkles, color: "bg-blue-600" },
  { id: "Turismo", name: "Turismo", icon: Plane, color: "bg-orange-500" },
  { id: "Gastronomía", name: "Gastronomía", icon: Coffee, color: "bg-red-500" },
  { id: "Comercios", name: "Comercios", icon: ShoppingBag, color: "bg-green-600" },
  { id: "Salud", name: "Salud", icon: Heart, color: "bg-pink-500" },
];

import { BeneficioRepository } from "@/lib/repositories/BeneficioRepository";
import { kineClubSearchSchema } from "@/lib/validations/searchParams";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function KineClubPage({ searchParams }: Props) {
  const params = kineClubSearchSchema.parse(await searchParams);
  const { cat: currentCat } = params;

  const beneficios = await BeneficioRepository.getAll(currentCat);
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <KineClubClient beneficios={beneficios} currentCat={currentCat} />
    </div>
  );
}
