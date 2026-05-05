import prisma from "@/lib/prisma";
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

interface Props {
  searchParams: Promise<{
    cat?: string;
  }>;
}

export default async function KineClubPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentCat = params.cat || "TODOS";

  const beneficios = await prisma.beneficioKineClub.findMany({
    where: currentCat !== "TODOS" ? { categoria: currentCat as any } : {},
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <KineClubClient beneficios={beneficios} currentCat={currentCat} />
    </div>
  );
}
