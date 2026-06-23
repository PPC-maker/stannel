// Prisma Client Singleton - Optimized for Cloud Run

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Cloud Run serverless optimization:
// - Limit connection pool to prevent exhaustion on serverless
// - Add connection timeout for cold starts
// - Add idle timeout to release stale connections
const databaseUrl = process.env.DATABASE_URL || '';
const pooledUrl = databaseUrl.includes('connection_limit')
  ? databaseUrl
  : databaseUrl + (databaseUrl.includes('?') ? '&' : '?') + 'connection_limit=5&pool_timeout=30&connect_timeout=30';

export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasourceUrl: pooledUrl,
});

// Keep singleton in development to avoid connection exhaustion during hot reload
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Graceful shutdown - close Prisma connection on exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Handle SIGTERM/SIGINT for Cloud Run graceful shutdown
const handleShutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

export default prisma;
