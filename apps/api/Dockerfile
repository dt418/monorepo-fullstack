# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY turbo.json ./

# Copy packages
COPY packages ./packages

# Copy api app
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @myorg/db db:generate

# Build packages and api
RUN pnpm --filter @myorg/api build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

# Install pnpm for production
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

# Copy necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules

# Create upload directory
RUN mkdir -p /app/uploads && chown -R api:nodejs /app/uploads

USER api

EXPOSE 3001

WORKDIR /app/apps/api

CMD ["node", "dist/index.js"]
