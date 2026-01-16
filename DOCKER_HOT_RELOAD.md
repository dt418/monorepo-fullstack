# Docker Hot Reload Guide

## Overview

Your Docker development environment is configured for **hot reload without build steps**. Changes to your code are automatically reflected in the running containers.

## How It Works

### Frontend (Vite)

- **Hot Module Replacement (HMR)**: Instant updates in the browser
- **File Watching**: Uses polling to detect changes in Docker volumes
- **No Restart Required**: Changes appear immediately

### Backend (tsx watch)

- **Auto Restart**: Server restarts automatically on file changes
- **Fast Reload**: TypeScript files are compiled on-the-fly
- **Preserves State**: Database and Redis connections persist

### Shared Packages (tsup watch)

- **Automatic Rebuild**: Packages rebuild when source files change
- **Parallel Watching**: All packages watch simultaneously via Turborepo
- **Dependency Updates**: Apps automatically pick up package changes

**When you change files in `packages/*`:**

1. `tsup --watch` detects the change
2. Package is rebuilt to `dist/`
3. Apps (api/web) automatically reload with new package code
4. Changes appear in ~2-3 seconds

## Usage

### Start Development Environment

```bash
pnpm docker:dev
```

This starts all services:

- PostgreSQL (port 5432)
- Redis (port 6379)
- API (port 3001) with hot reload
- Web (port 5173) with HMR
- Prisma Studio (port 5555)

### Make Changes

1. Edit any file in `apps/api/src/`, `apps/web/src/`, or `packages/*/src/`
2. Save the file
3. Changes are automatically detected:
   - **Frontend**: Browser updates instantly
   - **Backend**: Server restarts in ~1-2 seconds
   - **Packages**: Rebuild and apps reload in ~2-3 seconds

**Examples:**

- Change `packages/types/src/user.ts` → API and Web reload with new types
- Change `packages/utils/src/logger.ts` → API restarts with updated logger
- Change `packages/ui/src/Button.tsx` → Web HMR updates the component
- Change `apps/api/src/routes/auth.ts` → API restarts
- Change `apps/web/src/pages/Home.tsx` → Web HMR updates instantly

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f api
docker-compose -f docker-compose.dev.yml logs -f web
```

### Stop Services

```bash
docker-compose -f docker-compose.dev.yml down
```

## Configuration Details

### Architecture

The monorepo uses **Turborepo** to orchestrate parallel dev servers:

```text
┌─────────────────────────────────────────┐
│  Docker Container (api)                 │
│  ┌───────────────────────────────────┐  │
│  │ Turborepo --parallel              │  │
│  │  ├─ @myorg/api (tsx watch)        │  │
│  │  ├─ @myorg/types (tsup --watch)   │  │
│  │  ├─ @myorg/utils (tsup --watch)   │  │
│  │  └─ @myorg/db (no build needed)   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Docker Container (web)                 │
│  ┌───────────────────────────────────┐  │
│  │ Turborepo --parallel              │  │
│  │  ├─ @myorg/web (vite)             │  │
│  │  ├─ @myorg/ui (tsup --watch)      │  │
│  │  ├─ @myorg/types (tsup --watch)   │  │
│  │  └─ @myorg/utils (tsup --watch)   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Volume Mounts

The entire project is mounted into containers:

```yaml
volumes:
  - .:/app # Mount entire project
  - /app/node_modules # Preserve installed dependencies
```

### Vite Configuration

Hot reload is enabled with polling for Docker compatibility:

```typescript
server: {
  host: true,              // Listen on all addresses
  watch: {
    usePolling: true,      // Required for Docker volumes
    interval: 1000,        // Check every second
  }
}
```

### API Configuration

Uses `tsx watch` for automatic TypeScript compilation and restart:

```json
"dev": "tsx watch src/index.ts"
```

### Package Configuration

Shared packages use `tsup --watch` for automatic rebuilding:

```json
"dev": "tsup --watch"
```

**Package Export Strategy:**

- `@myorg/db`: Exports from `src/` (no build needed)
- `@myorg/types`: Exports from `dist/` (built by tsup)
- `@myorg/utils`: Exports from `dist/` (built by tsup)
- `@myorg/ui`: Exports from `dist/` (built by tsup)

**Initial Build:**
On container start, packages are built once, then watch mode keeps them updated.

## Troubleshooting

### Changes Not Detected

If hot reload isn't working:

1. **Check file permissions**: Ensure files are writable
2. **Restart containers**: `docker-compose -f docker-compose.dev.yml restart`
3. **Rebuild if needed**: `pnpm docker:dev:build`

### Package Changes Not Reflected

If changes to `packages/*` aren't showing up:

1. **Check package is being watched**: Look for `tsup` output in logs

   ```bash
   docker-compose -f docker-compose.dev.yml logs -f api | grep tsup
   ```

2. **Verify dist/ is being updated**: Check if the package's `dist/` folder has new timestamps

3. **Force rebuild packages**:

   ```bash
   docker-compose -f docker-compose.dev.yml exec api pnpm --filter @myorg/types build
   docker-compose -f docker-compose.dev.yml exec api pnpm --filter @myorg/utils build
   ```

4. **Restart the app container**:

   ```bash
   docker-compose -f docker-compose.dev.yml restart api
   docker-compose -f docker-compose.dev.yml restart web
   ```

### Slow Performance

If hot reload is slow:

1. **Adjust polling interval** in `vite.config.ts`:

   ```typescript
   watch: {
     usePolling: true,
     interval: 2000,  // Increase to 2 seconds
   }
   ```

2. **Exclude directories** from watching:

   ```typescript
   watch: {
     ignored: ['**/node_modules/**', '**/dist/**'];
   }
   ```

### Port Conflicts

If ports are already in use, update `.env`:

```env
API_PORT=3002
WEB_PORT=5174
POSTGRES_PORT=5433
REDIS_PORT=6380
```

## Performance Tips

1. **Use Docker Desktop with WSL2** (Windows) or **Docker Desktop** (Mac) for better file system performance
2. **Exclude large directories** from volume mounts if not needed
3. **Use named volumes** for node_modules to avoid syncing
4. **Adjust polling interval** based on your needs (higher = less CPU usage)

## Comparison: Dev vs Production

| Feature       | Development | Production |
| ------------- | ----------- | ---------- |
| Hot Reload    | ✅ Yes      | ❌ No      |
| Build Step    | ❌ No       | ✅ Yes     |
| Volume Mounts | ✅ Yes      | ❌ No      |
| Optimization  | ❌ No       | ✅ Yes     |
| File Watching | ✅ Yes      | ❌ No      |
| Image Size    | Large       | Small      |

## Next Steps

- Start coding! Changes will be reflected automatically
- Use `pnpm docker:dev` for development
- Use `pnpm docker:up` for production-like testing

## Understanding the Flow

### When you change a file in `apps/api/src/`

1. Volume mount syncs file to container
2. `tsx watch` detects change
3. API server restarts (~1-2 seconds)
4. New code is running

### When you change a file in `apps/web/src/`

1. Volume mount syncs file to container
2. Vite detects change
3. HMR updates browser instantly
4. No page refresh needed

### When you change a file in `packages/types/src/`

1. Volume mount syncs file to container
2. `tsup --watch` detects change
3. Package rebuilds to `dist/` (~1 second)
4. `tsx watch` (API) or Vite (Web) detects `dist/` change
5. API restarts or Web HMR updates (~1-2 seconds)
6. Total time: ~2-3 seconds

### Why the delay for packages?

Packages need to be compiled (TypeScript → JavaScript) before apps can use them. This is a two-step process:

1. Package rebuild (tsup)
2. App reload (tsx/vite)

This is still much faster than a full Docker rebuild!
