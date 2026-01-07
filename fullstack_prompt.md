# Full-stack TurboRepo CRUD App Prompt (for Claude)

Use the following prompt to generate a **complete full-stack
production-grade application** using **TurboRepo**, **React (Vite +
TypeScript)**, **PostgreSQL**, **Prisma**, **ArkType**, **Zod**,
**oRPC**, **Redis**, **Caching**, **Dependency Injection**, **Singleton
Pattern**, **WebSockets / Realtime**, **Docker**, **CI/CD**, and
optional **Bun/Deno** runtime support.

---

## Prompt

You are an expert full-stack architect. Generate a complete
production-ready full-stack monorepo boilerplate using **TurboRepo**
with the following requirements:

---

## Monorepo Structure

    apps/
      web/       → Vite + React + TS
      api/       → Backend API (TS, DI, oRPC, Prisma)
    packages/
      ui/        → Shared UI components
      types/     → Shared ArkType/Zod schemas
      config/    → Shared configs (ESLint, tsconfig, env)
      utils/     → Shared utilities
      db/        → Prisma client + migrations

---

## Frontend: apps/web

- Vite + React + TypeScript\
- React Query (TanStack Query)\
- Fully typed oRPC API client\
- Zod-validated forms\
- Shared types imported from packages/types\
- File upload UI (drag-and-drop)\
- Realtime updates via WebSockets\
- Role-based UI & navigation guards\
- CRUD pages for entities\
- Auth pages: login, register

---

## Backend: apps/api

### Core Requirements

- Node.js, Bun, or Deno (prefer Bun)\
- Strong DI container\
- Singleton instances for:
  - Prisma\
  - Redis\
  - WebSocket gateway\
- Clean folder structure\
- Fully typed oRPC server

### Features

- Auth: JWT + refresh tokens\
- RBAC access control\
- CRUD endpoints with Zod/ArkType validation\
- File uploads (local/S3)\
- Redis caching + invalidation\
- Realtime WebSocket broadcasting\
- Prisma ORM + migrations\
- Global error handler\
- Logging

---

## Realtime / WebSocket

- Realtime CRUD events\
- Room/Channel system\
- Presence tracking\
- Typed events shared from packages/types

---

## Database: packages/db

- PostgreSQL\
- Prisma schema + migrations\
- Seed\
- Prisma client singleton

---

## Docker & DevOps

### Docker

- Dockerfile (api)\
- Dockerfile (web)\
- docker-compose with:
  - api\
  - web\
  - postgres\
  - redis

### CI/CD

- GitHub Actions\
- Steps:
  - Install deps\
  - Lint\
  - Typecheck\
  - Test\
  - Build\
  - Build/push Docker images\
  - Deploy

---

## Additional Requirements

- Full TypeScript\
- ESLint + Prettier\
- Husky + lint-staged\
- Commitlint\
- Environment schema validation\
- Documentation comments

---

## Final Output Claude Must Produce

1. Complete monorepo folder structure\
2. Every file's full source code\
3. oRPC server + client\
4. CRUD implementation\
5. Auth + RBAC\
6. WebSocket realtime layer\
7. Redis caching\
8. Dockerfiles + Compose\
9. CI/CD workflows\
10. Documentation\
11. Run instructions for Node/Bun/Deno\
12. Fully self-contained final answer

---

### END OF PROMPT
