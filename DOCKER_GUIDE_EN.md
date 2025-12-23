# Docker & Docker Compose Documentation (English)

This document provides guidelines on using Docker and Docker Compose for development, testing, and deployment of the `monorepo-fullstack` project.

---

## 🏗 Docker Architecture

The project follows a simple Microservices architecture, containerized and managed using Docker Compose.

- **Frontend**: Nginx serving the built React/Next.js application.
- **Backend**: Node.js API running the NestJS/Express application.
- **Database**: PostgreSQL 16.
- **Database GUI**: Prisma Studio.
- **Cache**: Redis 7.

---

## 🚀 Quick Start Guide

### 1. Prerequisites

- Docker Engine >= 20.10
- Docker Compose v2
- Node.js & pnpm (only for local builds)

### 2. First-time Setup

```bash
# Copy environment template
cp .env.example .env

# Build and run containers in background mode
pnpm docker:up
```

### 3. Commonly Used Commands (via pnpm)

Utility scripts integrated in `package.json`:

- `pnpm docker:up`: Start the entire system (`docker-compose up -d`).
- `pnpm docker:down`: Stop and remove containers (`docker-compose down`).
- `pnpm docker:build`: Rebuild services (`docker-compose build`).
- `pnpm docker:db:migrate`: Run database migrations inside the container.
- `pnpm docker:db:seed`: Run database seeding inside the container.

---

## 📦 Service Details

| Service         | Port | Image                | Description                                    |
| :-------------- | :--- | :------------------- | :--------------------------------------------- |
| `postgres`      | 5432 | `postgres:16-alpine` | Main data storage with automatic healthcheck.  |
| `redis`         | 6379 | `redis:7-alpine`     | Caching and Pub/Sub.                           |
| `api`           | 3001 | Custom (Node 20)     | Backend server connecting to Postgres & Redis. |
| `web`           | 3000 | Custom (Nginx)       | Frontend app with proxy to `api` service.      |
| `prisma-studio` | 5555 | Custom (Node 20)     | Visual database browser for Prisma.            |

---

## 🛠 Dockerfile Breakdown

### Backend (`apps/api/Dockerfile`)

Uses **Multi-stage build** to optimize image size:

1.  **Stage 1 (Builder)**: Install `pnpm`, copy the entire workspace, run `prisma generate` and `pnpm build`.
2.  **Stage 2 (Runner)**: Copy only the built files (`dist`), production `node_modules`, and config files. Runs under a non-root user (`api`).

### Frontend (`apps/web/Dockerfile`)

1.  **Stage 1 (Builder)**: Build the web app and dependent packages (`@myorg/types`, `@myorg/ui`).
2.  **Stage 2 (Runner)**: Uses **Nginx Alpine**. Copies built files into Nginx's html folder and uses custom `nginx.conf` for SPA Routing.

---

## ⚙️ Environment Variables

Important variables in the `.env` file:

| Variable            | Default    | Description            |
| :------------------ | :--------- | :--------------------- |
| `POSTGRES_USER`     | `postgres` | Database user          |
| `POSTGRES_PASSWORD` | `postgres` | Database password      |
| `POSTGRES_DB`       | `myorg`    | Initial database name  |
| `JWT_SECRET`        | (random)   | JWT Secret key         |
| `API_PORT`          | `3001`     | Backend exported port  |
| `WEB_PORT`          | `3000`     | Frontend exported port |

---

## 💾 Data Persistence (Volumes)

- `postgres_data`: Persistent PostgreSQL data storage.
- `redis_data`: Redis data storage.
- `uploads_data`: File upload storage at `/app/uploads` in the `api` container.

---

## 🛠 Docker Development Environment

We provide a separate, standalone Docker environment for development that includes hot-reloading for both the API and Web applications.

```bash
# Start the development environment
pnpm docker:dev

# Rebuild containers (if dependencies change)
pnpm docker:dev:build
```

Access services at:

- **Web**: http://localhost:5173
- **API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555

---

## 🔍 Healthchecks

The system ensures correct boot sequence:

- `api` only starts when `postgres` and `redis` are **Healthy**.
- `web` only starts when `api` is ready.

---

> [!IMPORTANT]
> In Production, ensure you change the `POSTGRES_PASSWORD` and `JWT_SECRET` in the `.env` file.
