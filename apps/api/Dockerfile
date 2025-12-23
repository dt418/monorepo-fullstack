# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.json ./

# Copy packages and apps
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build api and its dependencies using turbo
# This will automatically run db:generate for @myorg/db
RUN pnpm dlx turbo run build --filter="@myorg/api..."

# Deployed standalone version (this flattens the workspace structure)
RUN pnpm --filter @myorg/api --prod deploy /app/out

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL for Prisma query engine
RUN apk add --no-cache openssl

# Re-enable corepack and pnpm for migration commands
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

# Copy the deployed application from builder
COPY --from=builder /app/out ./

# Create upload directory
RUN mkdir -p /app/uploads && chown -R api:nodejs /app/uploads

# Set ownership
RUN chown -R api:nodejs /app

USER api

EXPOSE 3001

CMD ["node", "dist/index.js"]
