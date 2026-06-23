import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;

function isConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Closed') ||
    message.includes('Connection') ||
    message.includes('ECONNREFUSED') ||
    message.includes("Can't reach database")
  );
}

/** Neon 등 서버리스 DB 연결 끊김 시 1회 재연결 후 재시도 */
export async function db<T>(fn: (client: PrismaClient) => Promise<T>): Promise<T> {
  try {
    return await fn(prisma);
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    console.warn('[prisma] connection lost, reconnecting…');
    await prisma.$connect();
    return await fn(prisma);
  }
}
