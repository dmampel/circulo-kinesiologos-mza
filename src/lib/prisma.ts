import { PrismaClient } from '@prisma/client';

const isProduction = process.env.NODE_ENV === 'production';

const prismaClientSingleton = () => {
  // Instrumentación de queries: sólo fuera de producción (design.md — D6).
  // El logging por query en serverless agrega overhead y ruido en cada
  // invocación, que es justamente lo que este change busca reducir. El
  // baseline de producción se mide desde afuera con `curl`, sin instrumentar
  // la aplicación.
  if (!isProduction) {
    const client = new PrismaClient({
      log: [{ emit: 'event', level: 'query' }],
    });

    client.$on('query', (e) => {
      console.log(`[prisma] ${e.duration}ms  ${e.query}`);
    });

    return client;
  }

  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (!isProduction) globalThis.prisma = prisma;
