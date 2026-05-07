import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.solicitud.findUnique({ where: { id: 'cmou8b7ql000c21h4dz4avt1c' } });
  console.log(s);
}
main().finally(() => prisma.$disconnect());
