import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profesionales = await prisma.profesional.findMany({
    select: { userId: true, email: true, nombre: true, apellido: true }
  });
  console.log('Profesionales vinculados:', profesionales);

  const solicitudes = await prisma.solicitud.findMany({
    where: { status: 'APROBADA' },
    select: { email: true, nombre: true, apellido: true }
  });
  console.log('Solicitudes Aprobadas:', solicitudes);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
