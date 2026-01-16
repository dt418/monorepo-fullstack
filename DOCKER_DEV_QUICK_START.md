# Docker Dev Mode - Quick Start

## Start Development

```bash
pnpm docker:dev
```

## What's Running?

| Service       | Port | Hot Reload | Purpose        |
| ------------- | ---- | ---------- | -------------- |
| PostgreSQL    | 5432 | N/A        | Database       |
| Redis         | 6379 | N/A        | Cache/Sessions |
| API           | 3001 | ✅ Yes     | Backend API    |
| Web           | 5173 | ✅ Yes     | Frontend       |
| Prisma Studio | 5555 | N/A        | DB Admin       |

## Make Changes

### Apps (Fast: 1-2 seconds)

- `apps/api/src/**/*.ts` → API restarts automatically
- `apps/web/src/**/*.tsx` → Browser updates instantly (HMR)

### Packages (Medium: 2-3 seconds)

- `packages/types/src/**/*.ts` → Rebuilds → Apps reload
- `packages/utils/src/**/*.ts` → Rebuilds → Apps reload
- `packages/ui/src/**/*.tsx` → Rebuilds → Web HMR updates
- `packages/db/src/**/*.ts` → Apps reload (no build needed)

## View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f api
docker-compose -f docker-compose.dev.yml logs -f web
```

## Stop Development

```bash
docker-compose -f docker-compose.dev.yml down
```

## Rebuild (if needed)

```bash
pnpm docker:dev:build
```

## Common Issues

### Changes not detected?

```bash
docker-compose -f docker-compose.dev.yml restart api
docker-compose -f docker-compose.dev.yml restart web
```

### Package changes not working?

```bash
# Check if tsup is running
docker-compose -f docker-compose.dev.yml logs api | grep tsup

# Force rebuild packages
docker-compose -f docker-compose.dev.yml exec api pnpm --filter @myorg/types build
```

### Port conflicts?

Edit `.env` and change ports:

```env
API_PORT=3002
WEB_PORT=5174
```

## Architecture

```text
Your Machine                Docker Containers
┌─────────────┐            ┌──────────────────┐
│             │            │  API Container   │
│  Edit Code  │  Volume    │  ┌────────────┐  │
│  in VSCode  │  Mount     │  │ tsx watch  │  │
│             │ ────────>  │  │ (API)      │  │
│             │            │  ├────────────┤  │
│             │            │  │ tsup watch │  │
│             │            │  │ (packages) │  │
│             │            │  └────────────┘  │
└─────────────┘            └──────────────────┘
                           ┌──────────────────┐
                           │  Web Container   │
                           │  ┌────────────┐  │
                           │  │ Vite HMR   │  │
                           │  │ (Web)      │  │
                           │  ├────────────┤  │
                           │  │ tsup watch │  │
                           │  │ (packages) │  │
                           │  └────────────┘  │
                           └──────────────────┘
```

## Tips

1. **Keep containers running** - No need to restart for code changes
2. **Watch the logs** - See real-time feedback on changes
3. **Use Prisma Studio** - Visual DB editor at <http://localhost:5555>
4. **Check health** - API health at <http://localhost:3001/health>

## Full Documentation

See [DOCKER_HOT_RELOAD.md](./DOCKER_HOT_RELOAD.md) for complete details.
