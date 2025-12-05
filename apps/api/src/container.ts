import 'reflect-metadata';
import { prisma } from '@myorg/db';
import { createLogger, getEnv } from '@myorg/utils';
import { Redis } from 'ioredis';
import { container } from 'tsyringe';

// Token constants for DI
export const TOKENS = {
  Prisma: Symbol('Prisma'),
  Redis: Symbol('Redis'),
  Logger: Symbol('Logger'),
  Env: Symbol('Env'),
} as const;

/**
 * Initialize dependency injection container with singletons
 */
export function initContainer() {
  const env = getEnv();
  const logger = createLogger('API');

  // Register Prisma singleton
  container.register(TOKENS.Prisma, { useValue: prisma });

  // Register Redis singleton
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  redis.on('error', (err) => {
    logger.error('Redis error', err);
  });

  container.register(TOKENS.Redis, { useValue: redis });

  // Register logger
  container.register(TOKENS.Logger, { useValue: logger });

  // Register env
  container.register(TOKENS.Env, { useValue: env });

  logger.info('DI container initialized');

  return container;
}

export { container };
