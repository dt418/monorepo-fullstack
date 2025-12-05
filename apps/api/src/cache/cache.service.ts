import { createLogger } from '@myorg/utils';
import { Redis } from 'ioredis';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../container';

const logger = createLogger('Cache');

/**
 * Redis cache service for caching and invalidation
 */
@injectable()
export class CacheService {
  private defaultTTL = 300; // 5 minutes

  constructor(@inject(TOKENS.Redis) private redis: Redis) {}

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}`, error);
      return null;
    }
  }

  /**
   * Set cached value with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, data);
      } else {
        await this.redis.setex(key, this.defaultTTL, data);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}`, error);
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}`, error);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug(`Deleted ${keys.length} keys matching ${pattern}`);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}`, error);
    }
  }

  /**
   * Get or set cache with callback
   */
  async getOrSet<T>(key: string, callback: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await callback();
    await this.set(key, value, ttl);
    return value;
  }
}

// Cache key generators
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  task: (id: string) => `task:${id}`,
  userTasks: (userId: string) => `tasks:user:${userId}`,
  allTasks: () => 'tasks:all:*',
};
