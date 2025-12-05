import { PrismaClient } from '@myorg/db';
import type { User, UpdateUser } from '@myorg/types';
import { createLogger } from '@myorg/utils';
import { inject, injectable } from 'tsyringe';
import { CacheService, CacheKeys } from '../cache';
import { TOKENS } from '../container';

const logger = createLogger('UserService');

interface PrismaUser {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User management service (admin operations)
 */
@injectable()
export class UserService {
  constructor(
    @inject(TOKENS.Prisma) private prisma: PrismaClient,
    @inject(CacheService) private cache: CacheService
  ) {}

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<User | null> {
    // Try cache first
    const cached = await this.cache.get<User>(CacheKeys.user(id));
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (user) {
      const sanitized = this.sanitizeUser(user);
      await this.cache.set(CacheKeys.user(id), sanitized);
      return sanitized;
    }

    return null;
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * List all users (admin only)
   */
  async list(page = 1, limit = 20): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users: users.map((u) => this.sanitizeUser(u)),
      total,
    };
  }

  /**
   * Update user (admin only)
   */
  async update(id: string, input: UpdateUser): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: input,
    });

    const sanitized = this.sanitizeUser(user);

    // Invalidate cache
    await this.cache.delete(CacheKeys.user(id));
    await this.cache.set(CacheKeys.user(id), sanitized);

    logger.info(`User updated: ${id}`);

    return sanitized;
  }

  /**
   * Delete user (admin only)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cache.delete(CacheKeys.user(id));

    logger.info(`User deleted: ${id}`);
  }

  /**
   * Remove sensitive fields from user object
   */
  private sanitizeUser(user: PrismaUser): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as User['role'],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
