// Prisma Client Singleton - Optimized for Cloud Run

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Cloud Run serverless optimization:
// - Reduce connection pool size to avoid exhaustion
// - Increase timeout for cold starts
export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Keep singleton in development to avoid connection exhaustion during hot reload
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Graceful shutdown - close Prisma connection on exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
