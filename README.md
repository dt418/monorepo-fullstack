# MyOrg Monorepo

Production-ready full-stack monorepo with Turborepo, React, Node.js, oRPC, Prisma, Redis, and WebSocket.

## 🚀 Quick Start

```bash
# Clone and install
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Start databases (requires Docker)
docker-compose up -d postgres redis

# Run database migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start development
pnpm dev
```

Open:

- Frontend: http://localhost:3000
- API: http://localhost:3001
- API Health: http://localhost:3001/healthz

## 📁 Project Structure

```
/
├── apps/
│   ├── api/          # Backend API (Hono + Prisma + Redis)
│   └── web/          # Frontend (Vite + React + React Query)
├── packages/
│   ├── types/        # Shared TypeScript types & Zod schemas
│   ├── orpc/         # oRPC contracts with ArkType
│   ├── utils/        # Shared utilities (env, logger)
│   └── ui/           # Shared UI components (shadcn)
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## 🛠️ Technology Stack

| Layer         | Technology                                       |
| ------------- | ------------------------------------------------ |
| **Monorepo**  | Turborepo + pnpm workspaces                      |
| **Frontend**  | Vite, React 18, TypeScript, React Query, Zustand |
| **UI**        | Tailwind CSS, shadcn/ui, Radix UI                |
| **Backend**   | Node.js, Hono, TypeScript                        |
| **RPC**       | oRPC (type-safe), ArkType validation             |
| **Database**  | PostgreSQL, Prisma ORM                           |
| **Cache**     | Redis (caching, rate limiting, sessions)         |
| **Auth**      | JWT, bcrypt, role-based access                   |
| **Realtime**  | WebSocket with Redis pub/sub                     |
| **Container** | Docker, Docker Compose                           |
| **CI/CD**     | GitHub Actions                                   |

## 📦 Available Scripts

```bash
# Development
pnpm dev           # Start all apps in dev mode
pnpm build         # Build all packages and apps
pnpm lint          # Run linting
pnpm typecheck     # Type checking

# Database
pnpm db:generate   # Generate Prisma client
pnpm db:migrate    # Run migrations
pnpm db:seed       # Seed database
pnpm db:studio     # Open Prisma Studio

# Docker
pnpm docker:up     # Start all containers
pnpm docker:down   # Stop all containers
pnpm docker:build  # Build Docker images
```

## 🔐 Authentication

Default seeded users:

| Email             | Password    | Role  |
| ----------------- | ----------- | ----- |
| admin@example.com | admin123456 | Admin |
| john@example.com  | user123456  | User  |
| jane@example.com  | user123456  | User  |

## 📡 API Endpoints

### Auth

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Tasks

- `GET /api/tasks` - List tasks
- `GET /api/tasks/:id` - Get task
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Files

- `POST /api/upload` - Upload file
- `GET /api/files` - List files
- `DELETE /api/files/:id` - Delete file

### Admin

- `GET /api/admin/users` - List users (admin only)
- `GET /api/admin/users/:id` - Get user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)

### Health

- `GET /healthz` - Health check
- `GET /readyz` - Readiness check

## 🐳 Docker Deployment

```bash
# Full stack
docker-compose up -d

# Or build and run
docker-compose up -d --build

# View logs
docker-compose logs -f api
```

## 🔄 WebSocket Events

| Event           | Direction       | Description       |
| --------------- | --------------- | ----------------- |
| `task.created`  | Server → Client | Task created      |
| `task.updated`  | Server → Client | Task updated      |
| `task.deleted`  | Server → Client | Task deleted      |
| `user.online`   | Server → Client | User came online  |
| `user.offline`  | Server → Client | User went offline |
| `presence.list` | Server → Client | Online users list |

## 🔧 Environment Variables

See `.env.example` for all variables. Key ones:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myorg
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-min-32-chars
```

## 🏃 Alternative Runtimes

See [README_BUN_DENO.md](./README_BUN_DENO.md) for Bun and Deno support.

```bash
# Bun
bun run --filter @myorg/api dev:bun

# Deno
deno run --allow-all apps/api/src/index.deno.ts
```

## 📈 Best Practices

### Cache Invalidation

- Task cache invalidated on create/update/delete
- User cache invalidated on update/delete
- Pattern-based invalidation for lists

### WebSocket Scaling

- Redis pub/sub for multi-server deployments
- Heartbeat for connection health
- Automatic reconnection on client

### Security

- ✅ JWT with configurable expiry
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Rate limiting per IP/user
- ✅ Token blacklist for logout
- ✅ CORS configuration
- ✅ Helmet-like security headers

## 📝 License

MIT
