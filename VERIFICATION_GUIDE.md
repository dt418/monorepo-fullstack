# Hot Reload Verification Guide

Complete guide to verify your Docker + Turborepo hot reload configuration.

## Quick Start

### Option 1: Automated Verification (Recommended)

**Windows (PowerShell):**

```powershell
.\verify-hot-reload.ps1
```

**Linux/Mac (Bash):**

```bash
chmod +x verify-hot-reload.sh
./verify-hot-reload.sh
```

This will automatically check all configuration requirements.

### Option 2: Manual Checklist

Follow the checklist in [HOT_RELOAD_CHECKLIST.md](./HOT_RELOAD_CHECKLIST.md)

### Option 3: Interactive Testing

Follow the step-by-step guide in [HOT_RELOAD_TESTING.md](./HOT_RELOAD_TESTING.md)

## What Gets Verified

### 1. Configuration Files

✅ **docker-compose.dev.yml**

- Turborepo parallel mode enabled
- Volume mounts configured
- Anonymous volumes for node_modules
- Initial package builds

✅ **apps/web/vite.config.ts**

- Host binding enabled
- Polling enabled for Docker
- Polling interval configured

✅ **Package dev scripts**

- All packages have `tsup --watch` configured
- DB package uses direct imports

✅ **turbo.json**

- Dev task configured
- Caching disabled for dev
- Persistent mode enabled

✅ **Package exports**

- Correct export paths (dist/ or src/)
- Build requirements identified

✅ **Dockerfiles**

- Dependencies installed
- Workspace files copied

### 2. Runtime Environment

✅ **Docker**

- Docker installed
- Docker daemon running
- docker-compose available

✅ **Package Manager**

- pnpm installed
- Correct version (>=9.0.0)

✅ **Environment**

- .env file exists or defaults used
- .env.example available

## Verification Output

### Expected Output (All Passing)

```text
🔍 Hot Reload Configuration Verification
========================================

━━━ 1. Docker Compose Configuration ━━━
✓ docker-compose.dev.yml exists
✓ API container uses Turborepo parallel mode
✓ Web container uses Turborepo parallel mode
✓ Project root mounted as volume
✓ Anonymous volumes configured for node_modules

━━━ 2. Vite Configuration ━━━
✓ apps/web/vite.config.ts exists
✓ Vite configured with host: true
✓ Vite configured with usePolling: true
✓ Vite polling interval configured

━━━ 3. Package Dev Scripts ━━━
✓ types has dev script with tsup --watch
✓ utils has dev script with tsup --watch
✓ ui has dev script with tsup --watch
ℹ db uses direct imports (no build needed)

━━━ 4. Turbo Configuration ━━━
✓ turbo.json exists
✓ dev task configured in turbo.json
✓ dev task has cache: false
✓ dev task marked as persistent

━━━ 5. Package Export Configuration ━━━
ℹ types exports from dist/ (needs build)
ℹ utils exports from dist/ (needs build)
ℹ ui exports from dist/ (needs build)
ℹ db exports from src/ (direct import)

━━━ 6. Dockerfile Configuration ━━━
✓ apps/api/Dockerfile.dev exists
✓ API Dockerfile installs dependencies
✓ apps/web/Dockerfile.dev exists
✓ Web Dockerfile installs dependencies

━━━ 7. Environment Configuration ━━━
✓ .env file exists
✓ .env.example exists

━━━ 8. Docker Installation ━━━
✓ Docker is installed
✓ Docker daemon is running
✓ docker-compose is installed

━━━ 9. Package Manager ━━━
✓ pnpm is installed
ℹ pnpm version: 9.14.2

━━━ Summary ━━━

Results:
  Passed:   25
  Failed:   0
  Warnings: 0
  Total:    25

✓ Configuration looks good!

Next steps:
  1. Run: pnpm docker:dev
  2. Wait for services to start
  3. Make a change to test hot reload

See DOCKER_DEV_QUICK_START.md for testing instructions
```

## Common Issues

### Issue: "Docker daemon is not running"

**Solution:**

```bash
# Windows: Start Docker Desktop
# Linux: sudo systemctl start docker
# Mac: Start Docker Desktop
```

### Issue: "pnpm is not installed"

**Solution:**

```bash
npm install -g pnpm@latest
```

### Issue: "Turborepo parallel mode not configured"

**Solution:**
Check `docker-compose.dev.yml` commands include:

```yaml
command: sh -c "... && turbo run dev --filter=... --parallel"
```

### Issue: "Vite not configured with usePolling"

**Solution:**
Update `apps/web/vite.config.ts`:

```typescript
server: {
  host: true,
  watch: {
    usePolling: true,
    interval: 1000,
  }
}
```

## After Verification

Once verification passes:

### 1. Start Development

```bash
pnpm docker:dev
```

### 2. Test Hot Reload

**Test API:**

```bash
# Edit apps/api/src/routes/health.ts
# Watch logs: docker-compose -f docker-compose.dev.yml logs -f api
# Expected: Restart in 1-2 seconds
```

**Test Web:**

```bash
# Edit apps/web/src/App.tsx
# Watch browser
# Expected: Instant HMR update
```

**Test Package:**

```bash
# Edit packages/types/src/user.ts
# Watch logs: docker-compose -f docker-compose.dev.yml logs -f api
# Expected: Rebuild + reload in 2-3 seconds
```

### 3. Monitor Performance

```bash
# Check resource usage
docker stats

# Expected:
# - CPU: <50% per container
# - Memory: Stable
# - No memory leaks
```

## Troubleshooting Verification Failures

### Failed Check: "API container not using Turborepo parallel mode"

**Diagnosis:**

```bash
grep "turbo run dev" docker-compose.dev.yml
```

**Fix:**
Update API command in `docker-compose.dev.yml`:

```yaml
command: sh -c "pnpm --filter @myorg/db db:generate && pnpm --filter @myorg/types build && pnpm --filter @myorg/utils build && turbo run dev --filter=@myorg/api --filter=@myorg/db --filter=@myorg/types --filter=@myorg/utils --parallel"
```

### Failed Check: "Package missing dev script"

**Diagnosis:**

```bash
cat packages/types/package.json | grep '"dev"'
```

**Fix:**
Add to `packages/types/package.json`:

```json
{
  "scripts": {
    "dev": "tsup --watch"
  }
}
```

### Failed Check: "dev task not configured in turbo.json"

**Diagnosis:**

```bash
cat turbo.json | grep -A 5 '"dev"'
```

**Fix:**
Add to `turbo.json`:

```json
{
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Re-verification

After fixing issues, run verification again:

```bash
# Windows
.\verify-hot-reload.ps1

# Linux/Mac
./verify-hot-reload.sh
```

## Documentation Reference

| Document                                                 | Purpose                       |
| -------------------------------------------------------- | ----------------------------- |
| [verify-hot-reload.ps1](./verify-hot-reload.ps1)         | Windows verification script   |
| [verify-hot-reload.sh](./verify-hot-reload.sh)           | Linux/Mac verification script |
| [HOT_RELOAD_CHECKLIST.md](./HOT_RELOAD_CHECKLIST.md)     | Manual checklist              |
| [HOT_RELOAD_TESTING.md](./HOT_RELOAD_TESTING.md)         | Detailed testing guide        |
| [DOCKER_DEV_QUICK_START.md](./DOCKER_DEV_QUICK_START.md) | Quick reference               |
| [DOCKER_HOT_RELOAD.md](./DOCKER_HOT_RELOAD.md)           | Complete guide                |
| [CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md)               | Technical details             |

## Support

If verification fails and you can't resolve the issues:

1. Check the specific failed item in the output
2. Review the corresponding section in [DOCKER_HOT_RELOAD.md](./DOCKER_HOT_RELOAD.md)
3. Follow the troubleshooting steps in [HOT_RELOAD_TESTING.md](./HOT_RELOAD_TESTING.md)
4. Check Docker Desktop settings (WSL2, VirtioFS)
5. Rebuild containers: `pnpm docker:dev:build`

## Success Criteria

Your configuration is correct when:

- ✅ Verification script passes with 0 failures
- ✅ All services start successfully
- ✅ Watchers are running (check logs)
- ✅ File changes trigger reloads
- ✅ Performance is acceptable

## Next Steps

1. ✅ Run verification script
2. ✅ Fix any failures
3. ✅ Start development: `pnpm docker:dev`
4. ✅ Test hot reload with real changes
5. ✅ Start coding!
