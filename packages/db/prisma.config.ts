import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env from repo root if exists (local dev)
const rootEnvPath = resolve(process.cwd(), '../../.env');
if (existsSync(rootEnvPath)) {
  config({ path: rootEnvPath });
}

// 👇 THIS IS THE KEY
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://user:password@localhost:5432/dummy';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'prisma/seed.ts',
  },
  datasource: {
    url: DATABASE_URL,
  },
});
