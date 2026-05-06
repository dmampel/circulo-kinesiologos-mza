import { NextResponse } from "next/server";
import { CategoriaRepository } from "@/lib/repositories/CategoriaRepository";

export async function GET() {
  try {
    const categorias = await CategoriaRepository.getAll();
    return NextResponse.json(categorias);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching categories" }, { status: 500 });
  }
}
