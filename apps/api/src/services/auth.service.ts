/* eslint-disable import/no-named-as-default-member */
import { PrismaClient } from '@myorg/db';
import type { User, LoginInput, RegisterInput, AuthTokens } from '@myorg/types';
import { getEnv, createLogger } from '@myorg/utils';
import { compare, hash } from 'bcrypt';
// eslint-disable-next-line import/default
import jwt from 'jsonwebtoken';
import { inject, injectable } from 'tsyringe';
import { v4 as uuid } from 'uuid';
import { CacheService, CacheKeys } from '../cache';
import { TOKENS } from '../container';
import { HTTPError } from '../exceptions/http.error';

const logger = createLogger('AuthService');

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

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
 * Authentication service for login, register, and token management
 */
@injectable()
export class AuthService {
  constructor(
    @inject(TOKENS.Prisma) private prisma: PrismaClient,
    @inject(CacheService) private cache: CacheService
  ) {}

  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new HTTPError(409, { message: 'User already exists', details: { email: input.email } });
    }

    // Hash password
    const passwordHash = await hash(input.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: 'user',
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Cache user
    await this.cache.set(CacheKeys.user(user.id), this.sanitizeUser(user));

    logger.info(`User registered: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Login user with email and password
   */
  async login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new HTTPError(401, { message: 'Invalid credentials' });
    }

    // Verify password
    const valid = await compare(input.password, user.passwordHash);
    if (!valid) {
      throw new HTTPError(401, { message: 'Invalid credentials' });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Find refresh token in database
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new HTTPError(401, { message: 'Invalid or expired refresh token' });
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: stored.id },
    });

    // Generate new tokens
    return this.generateTokens(stored.user.id, stored.user.email, stored.user.role);
  }

  /**
   * Logout - invalidate refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  /**
   * Verify access token and return payload
   */
  verifyAccessToken(token: string): JwtPayload {
    const env = getEnv();
    return jwt.verify(token, env.JWT_SECRET as jwt.Secret) as JwtPayload;
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const env = getEnv();

    const payload: JwtPayload = { userId, email, role };

    const accessToken = jwt.sign(
      payload,
      env.JWT_SECRET as jwt.Secret,
      {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      } as jwt.SignOptions
    );

    const refreshToken = uuid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
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
