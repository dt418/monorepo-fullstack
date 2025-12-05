import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton
 * This ensures only one instance is created throughout the application
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

/**
 * Get the Prisma client singleton instance
 */
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Export Prisma types for convenience
export * from '@prisma/client';
