# Technology Stack

## Build System

- **Monorepo**: Turborepo with pnpm workspaces
- **Package Manager**: pnpm (>=9.0.0)
- **Node Version**: >=20.0.0

## Frontend Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query (@tanstack/react-query) + Zustand
- **Routing**: React Router DOM
- **Real-time**: Socket.io client

## Backend Stack

- **Runtime**: Node.js with Hono framework
- **Language**: TypeScript (ES modules)
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Sessions**: Redis (ioredis)
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io with Redis pub/sub
- **DI Container**: tsyringe with reflect-metadata
- **File Upload**: multer

## Shared Packages

- **Types**: Zod schemas for validation
- **Database**: Prisma client and utilities
- **UI**: shadcn/ui component library
- **Utils**: Environment config, logging utilities

## Development Tools

- **Linting**: ESLint with TypeScript, import ordering
- **Formatting**: Prettier (semi, single quotes, 100 char width)
- **Testing**: Vitest
- **Git Hooks**: Lefthook with commitlint (conventional commits)
- **Type Checking**: TypeScript strict mode

## Common Commands

```bash
# Development
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all packages and apps
pnpm test             # Run all tests
pnpm lint             # Run linting
pnpm typecheck        # Type checking

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:push          # Push schema changes

# Docker
pnpm docker:up        # Start containers (PostgreSQL + Redis)
pnpm docker:dev       # Start dev environment with hot reload
pnpm docker:build     # Build production images

# Formatting
pnpm format           # Format all files
pnpm format:check     # Check formatting
```

## Environment Requirements

- Docker (for databases)
- Node.js >=20.0.0
- pnpm >=9.0.0
