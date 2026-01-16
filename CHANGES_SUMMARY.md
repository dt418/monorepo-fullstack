# Docker Hot Reload Changes Summary

## Problem

When changing files in `packages/*` (shared workspace packages), the changes were not being reflected in the running Docker containers because the packages weren't being rebuilt.

## Solution

Configured Turborepo to run package watchers in parallel with the main app dev servers, enabling automatic rebuilding of packages when their source files change.

## Changes Made

### 1. Updated `docker-compose.dev.yml`

#### API Container

**Before:**

```yaml
command: sh -c "pnpm --filter @myorg/db db:generate && pnpm --filter @myorg/api dev"
```

**After:**

```yaml
command: sh -c "pnpm --filter @myorg/db db:generate && pnpm --filter @myorg/types build && pnpm --filter @myorg/utils build && turbo run dev --filter=@myorg/api --filter=@myorg/db --filter=@myorg/types --filter=@myorg/utils --parallel"
```

**What this does:**

1. Generates Prisma client
2. Builds packages initially (types, utils)
3. Runs Turborepo in parallel mode to watch:
   - API server (`tsx watch`)
   - Types package (`tsup --watch`)
   - Utils package (`tsup --watch`)
   - DB package (no build needed)

#### Web Container

**Before:**

```yaml
command: pnpm --filter @myorg/web dev --host
```

**After:**

```yaml
command: sh -c "pnpm --filter @myorg/ui build && pnpm --filter @myorg/types build && pnpm --filter @myorg/utils build && turbo run dev --filter=@myorg/web --filter=@myorg/ui --filter=@myorg/types --filter=@myorg/utils --parallel"
```

**What this does:**

1. Builds packages initially (ui, types, utils)
2. Runs Turborepo in parallel mode to watch:
   - Web app (Vite HMR)
   - UI package (`tsup --watch`)
   - Types package (`tsup --watch`)
   - Utils package (`tsup --watch`)

### 2. Enhanced `apps/web/vite.config.ts`

**Added:**

```typescript
server: {
  host: true,              // Listen on all addresses (required for Docker)
  watch: {
    usePolling: true,      // Enable polling for Docker volumes
    interval: 1000,        // Check for changes every second
  }
}
```

**Why:**

- `host: true` allows Vite to be accessible from outside the container
- `usePolling: true` ensures file changes are detected in Docker volumes (native file watching doesn't work reliably with Docker volumes)
- `interval: 1000` checks for changes every second (balance between responsiveness and CPU usage)

### 3. Created Documentation

- **DOCKER_HOT_RELOAD.md**: Comprehensive guide explaining how hot reload works
- **DOCKER_DEV_QUICK_START.md**: Quick reference for common tasks
- **CHANGES_SUMMARY.md**: This file

## How It Works Now

### File Change Flow

#### Apps (`apps/api/src/*` or `apps/web/src/*`)

```text
1. Edit file → 2. Volume sync → 3. tsx/vite detects → 4. Reload (1-2s)
```

#### Packages (`packages/*/src/*`)

```text
1. Edit file → 2. Volume sync → 3. tsup detects → 4. Rebuild dist/ → 5. tsx/vite detects → 6. Reload (2-3s)
```

### Architecture

```text
┌─────────────────────────────────────────┐
│  API Container                          │
│  ┌───────────────────────────────────┐  │
│  │ Turborepo (parallel)              │  │
│  │  ├─ @myorg/api (tsx watch)        │  │
│  │  ├─ @myorg/types (tsup --watch)   │  │
│  │  ├─ @myorg/utils (tsup --watch)   │  │
│  │  └─ @myorg/db (direct import)     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Web Container                          │
│  ┌───────────────────────────────────┐  │
│  │ Turborepo (parallel)              │  │
│  │  ├─ @myorg/web (vite HMR)         │  │
│  │  ├─ @myorg/ui (tsup --watch)      │  │
│  │  ├─ @myorg/types (tsup --watch)   │  │
│  │  └─ @myorg/utils (tsup --watch)   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Benefits

1. **No Manual Rebuilds**: Changes to packages automatically trigger rebuilds
2. **Fast Feedback**: See changes in 2-3 seconds
3. **Parallel Watching**: All packages watch simultaneously
4. **Type Safety**: TypeScript compilation happens automatically
5. **No Docker Rebuilds**: Everything happens inside running containers

## Usage

```bash
# Start development (one command)
pnpm docker:dev

# Make changes to any file
# - apps/api/src/**/*.ts
# - apps/web/src/**/*.tsx
# - packages/types/src/**/*.ts
# - packages/utils/src/**/*.ts
# - packages/ui/src/**/*.tsx
# - packages/db/src/**/*.ts

# Changes are automatically detected and applied!
```

## Performance

| Change Location   | Detection Time | Reload Time   | Total Time |
| ----------------- | -------------- | ------------- | ---------- |
| `apps/api/src/`   | Instant        | 1-2s          | 1-2s       |
| `apps/web/src/`   | Instant        | Instant (HMR) | Instant    |
| `packages/*/src/` | Instant        | 2-3s          | 2-3s       |

## Troubleshooting

### Changes not detected?

```bash
docker-compose -f docker-compose.dev.yml restart api
docker-compose -f docker-compose.dev.yml restart web
```

### Package changes not working?

```bash
# Check if tsup is running
docker-compose -f docker-compose.dev.yml logs api | grep tsup

# Force rebuild
docker-compose -f docker-compose.dev.yml exec api pnpm --filter @myorg/types build
```

### Need to rebuild containers?

```bash
pnpm docker:dev:build
```

## Technical Details

### Why Turborepo?

- Manages parallel execution of multiple dev scripts
- Respects workspace dependencies
- Provides consistent output formatting
- Already configured in the project

### Why tsup?

- Fast TypeScript bundler
- Built-in watch mode
- Generates both `.js` and `.d.ts` files
- Already used by all packages

### Why Initial Build?

Packages need to be built once before watch mode starts because:

1. Apps import from `dist/` (not `src/`)
2. First run needs compiled code
3. Watch mode only rebuilds on changes

### Package Export Strategy

- `@myorg/db`: Exports from `src/index.ts` (no build needed, direct TypeScript import)
- `@myorg/types`: Exports from `dist/index.js` (needs build)
- `@myorg/utils`: Exports from `dist/index.js` (needs build)
- `@myorg/ui`: Exports from `dist/index.js` (needs build)

## Next Steps

1. Start development: `pnpm docker:dev`
2. Make changes to any file
3. Watch the magic happen! ✨

For more details, see:

- [DOCKER_HOT_RELOAD.md](./DOCKER_HOT_RELOAD.md) - Complete guide
- [DOCKER_DEV_QUICK_START.md](./DOCKER_DEV_QUICK_START.md) - Quick reference
