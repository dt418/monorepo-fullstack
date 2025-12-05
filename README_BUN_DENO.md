# Bun & Deno Runtime Support

This document provides instructions for running the API with alternative JavaScript runtimes.

## Bun Support

### Prerequisites

- [Bun](https://bun.sh) v1.0+

### Running with Bun

```bash
# Install dependencies (Bun can use pnpm lockfile)
bun install

# Generate Prisma client
bunx prisma generate

# Run development server
bun run --filter @myorg/api dev:bun

# Or directly
cd apps/api
bun run src/index.bun.ts
```

### Bun Advantages

- **Faster startup**: ~3x faster cold start
- **Native TypeScript**: No transpilation needed
- **Built-in WebSocket**: Use `Bun.serve()` native WebSocket

### Compatibility Notes

- ✅ Hono works perfectly with Bun
- ✅ Prisma works with Bun
- ✅ ioredis works with Bun
- ⚠️ Some Node.js polyfills may be needed
- ⚠️ `@hono/node-server` should be replaced with Bun.serve

### Bun-specific Changes (index.bun.ts)

```typescript
// Use Bun.serve instead of @hono/node-server
Bun.serve({
  port: 3001,
  fetch: app.fetch,
  websocket: {
    open(ws) {
      /* ... */
    },
    message(ws, msg) {
      /* ... */
    },
    close(ws) {
      /* ... */
    },
  },
});
```

---

## Deno Support

### Prerequisites

- [Deno](https://deno.land) v1.40+

### Running with Deno

```bash
# Run with permissions
deno run \
  --allow-net \
  --allow-read \
  --allow-write \
  --allow-env \
  apps/api/src/index.deno.ts
```

### Deno Configuration

Create `deno.json` in `apps/api`:

```json
{
  "tasks": {
    "dev": "deno run --allow-all --watch src/index.deno.ts",
    "start": "deno run --allow-all src/index.deno.ts"
  },
  "imports": {
    "hono": "npm:hono@^3.11.0",
    "@prisma/client": "npm:@prisma/client@^5.7.0",
    "ioredis": "npm:ioredis@^5.3.2"
  },
  "compilerOptions": {
    "strict": true
  }
}
```

### Compatibility Notes

- ✅ Hono has first-class Deno support
- ⚠️ Prisma requires special setup for Deno
- ⚠️ Replace `ioredis` with `deno-redis` for native support
- ⚠️ File system APIs differ slightly
- ⚠️ `ws` library may need alternatives

### Deno Alternatives

| Node.js Package | Deno Alternative                     |
| --------------- | ------------------------------------ |
| `ioredis`       | `npm:ioredis` or `deno.land/x/redis` |
| `ws`            | Native `Deno.upgradeWebSocket`       |
| `bcryptjs`      | `deno.land/x/bcrypt`                 |
| `jsonwebtoken`  | `deno.land/x/djwt`                   |
| `uuid`          | `crypto.randomUUID()` (built-in)     |

### Prisma with Deno

```bash
# Generate Prisma client for Deno
npx prisma generate --generator client

# Or use Data Proxy
# Set DATABASE_URL to a Prisma Data Proxy URL
```

### Deno Deploy

For Deno Deploy, use the edge-compatible version:

```typescript
import { Hono } from 'https://deno.land/x/hono/mod.ts';

const app = new Hono();

app.get('/healthz', (c) => c.json({ status: 'ok' }));

Deno.serve(app.fetch);
```

---

## Performance Comparison

| Runtime | Cold Start | Memory | npm Compat  |
| ------- | ---------- | ------ | ----------- |
| Node.js | ~200ms     | ~50MB  | ✅ Full     |
| Bun     | ~50ms      | ~30MB  | ✅ High     |
| Deno    | ~100ms     | ~40MB  | ⚠️ Via npm: |

---

## Recommended for Production

1. **Node.js**: Most stable, full ecosystem support
2. **Bun**: Best for performance-critical workloads
3. **Deno**: Best for edge/serverless deployments

---

## Docker with Alternative Runtimes

### Bun Dockerfile

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

EXPOSE 3001
CMD ["bun", "run", "src/index.bun.ts"]
```

### Deno Dockerfile

```dockerfile
FROM denoland/deno:1.40.0

WORKDIR /app
COPY . .

RUN deno cache src/index.deno.ts

USER deno
EXPOSE 3001

CMD ["deno", "run", "--allow-all", "src/index.deno.ts"]
```
