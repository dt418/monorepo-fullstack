# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy packages
COPY packages/types ./packages/types
COPY packages/ui ./packages/ui
COPY packages/db ./packages/db
COPY apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build packages
RUN pnpm --filter @myorg/types build 2>/dev/null || true
RUN pnpm --filter @myorg/ui build 2>/dev/null || true

# Build web app
RUN pnpm --filter @myorg/web build

# Production stage
FROM nginx:alpine AS runner

# Copy nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
