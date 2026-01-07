# Project Structure

## Monorepo Organization

```text
/
├── apps/                    # Applications
│   ├── api/                # Backend API (Hono + Prisma + Redis)
│   └── web/                # Frontend (Vite + React)
├── packages/               # Shared packages
│   ├── db/                 # Database layer (Prisma)
│   ├── types/              # Shared TypeScript types & Zod schemas
│   ├── ui/                 # UI components (shadcn/ui)
│   └── utils/              # Shared utilities
├── uploads/                # File upload storage
├── .github/workflows/      # CI/CD configurations
├── docker-compose.yml      # Production containers
├── docker-compose.dev.yml  # Development containers
├── turbo.json             # Turborepo configuration
└── pnpm-workspace.yaml    # Workspace definition
```

## Application Structure

### API (`apps/api/`)

```text
src/
├── cache/          # Redis caching utilities
├── container.ts    # DI container setup (tsyringe)
├── exceptions/     # Custom error classes
├── index.ts        # Application entry point
├── middleware/     # Hono middleware (auth, cors, etc.)
├── routes/         # API route handlers
├── services/       # Business logic services
└── websocket/      # Socket.io handlers
```

### Web (`apps/web/`)

```text
src/
├── components/     # React components
├── hooks/          # Custom React hooks (e.g., useAuth)
├── pages/          # Route components
├── services/       # API client services
├── stores/         # State management
└── utils/          # Frontend utilities
```

## Package Structure

### Database (`packages/db/`)

```text
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Migration files
│   └── seed.ts         # Database seeding
└── src/
    └── index.ts        # Prisma client exports
```

### Types (`packages/types/`)

```text
src/
├── auth.ts         # Authentication types
├── task.ts         # Task-related types
├── user.ts         # User types
└── index.ts        # Type exports
```

## Naming Conventions

- **Packages**: `@myorg/package-name` (kebab-case)
- **Files**: kebab-case for configs, camelCase for TypeScript
- **Components**: PascalCase (React components)
- **Hooks**: camelCase starting with `use`
- **Services**: camelCase with Service suffix
- **Types**: PascalCase for interfaces/types

## Import Patterns

- Use workspace references: `@myorg/package-name`
- Prefer type imports: `import type { User } from '@myorg/types'`
- Import order: builtin → external → internal → relative
- No relative imports across package boundaries

## File Organization

- Group by feature, not by file type
- Keep related files close together
- Use index files for clean exports
- Separate concerns (types, logic, UI)

## Configuration Files

- Root-level configs apply to entire monorepo
- Package-specific configs override root configs
- Environment files: `.env` (root), `.env.example` (template)
- TypeScript configs: extend from root `tsconfig.json`
