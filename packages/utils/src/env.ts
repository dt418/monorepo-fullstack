import { existsSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { z } from 'zod';

/**
 * Environment schema for validation
 */
export const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3001),
  WEB_PORT: z.coerce.number().default(5173),
  HOST: z.string().default('0.0.0.0'),

  // URLs
  API_URL: z.string().url().default('http://localhost:3001'),
  WEB_URL: z.string().url().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // File Upload
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Optional S3
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 */
export function parseEnv(env: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const formatted = result.error.format();
    console.error('❌ Invalid environment variables:', formatted);
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

/**
 * Get validated environment (cached)
 */
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    // Load .env from root if it exists
    const rootEnvPath = join(process.cwd(), '.env');
    const projectEnvPath = join(process.cwd(), '..', '..', '.env');

    if (existsSync(rootEnvPath)) {
      const myEnv = dotenv.config({ path: rootEnvPath });
      expand(myEnv);
    } else if (existsSync(projectEnvPath)) {
      const myEnv = dotenv.config({ path: projectEnvPath });
      expand(myEnv);
    } else {
      // Fallback to default dotenv.config() which looks for .env in current dir
      const myEnv = dotenv.config();
      expand(myEnv);
    }

    cachedEnv = parseEnv(process.env as Record<string, string>);
  }
  return cachedEnv;
}
