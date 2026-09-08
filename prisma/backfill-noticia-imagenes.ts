// Script one-off: para cada Noticia con imagen_url != null y sin filas en
// NoticiaImagen, crea una fila con orden: 0. Idempotente (la condición de
// conteo evita duplicados en corridas repetidas) y no destructivo: solo
// inserta, `imagen_url` no se toca.
//
// Correr con: npx ts-node --project prisma/tsconfig.seed.json prisma/backfill-noticia-imagenes.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const noticiasSinGaleria = await prisma.noticia.findMany({
    where: {
      imagen_url: { not: null },
      imagenes: { none: {} },
    },
    select: { id: true, imagen_url: true },
  });

  console.log(`Encontradas ${noticiasSinGaleria.length} noticias para backfill.`);

  for (const noticia of noticiasSinGaleria) {
    if (!noticia.imagen_url) continue;
    await prisma.noticiaImagen.create({
      data: {
        noticiaId: noticia.id,
        url: noticia.imagen_url,
        orden: 0,
      },
    });
    console.log(`  ✓ ${noticia.id}`);
  }

  console.log("Backfill completo.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
