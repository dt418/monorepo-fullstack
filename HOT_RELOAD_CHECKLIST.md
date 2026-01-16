# Hot Reload Configuration Checklist

Use this checklist to verify your Docker hot reload setup is correct.

## Pre-flight Checks

- [ ] Docker is installed and running
- [ ] pnpm is installed (>=9.0.0)
- [ ] `.env` file exists (or will use defaults)
- [ ] Project dependencies installed (`pnpm install`)

## Configuration Checks

### 1. Docker Compose (`docker-compose.dev.yml`)

- [ ] File exists
- [ ] API container command includes `turbo run dev --parallel`
- [ ] Web container command includes `turbo run dev --parallel`
- [ ] Volume mount: `.:/app` exists
- [ ] Anonymous volumes for `node_modules` exist
- [ ] Packages are built before watch mode starts

**API Command Should Look Like:**

```yaml
command: sh -c "pnpm --filter @myorg/db db:generate && pnpm --filter @myorg/types build && pnpm --filter @myorg/utils build && turbo run dev --filter=@myorg/api --filter=@myorg/db --filter=@myorg/types --filter=@myorg/utils --parallel"
```

**Web Command Should Look Like:**

```yaml
command: sh -c "pnpm --filter @myorg/ui build && pnpm --filter @myorg/types build && pnpm --filter @myorg/utils build && turbo run dev --filter=@myorg/web --filter=@myorg/ui --filter=@myorg/types --filter=@myorg/utils --parallel"
```

### 2. Vite Configuration (`apps/web/vite.config.ts`)

- [ ] File exists
- [ ] `server.host: true` is set
- [ ] `server.watch.usePolling: true` is set
- [ ] `server.watch.interval` is set (recommended: 1000)

**Should Look Like:**

```typescript
server: {
  host: true,
  watch: {
    usePolling: true,
    interval: 1000,
  }
}
```

### 3. Package Dev Scripts

Check each package's `package.json`:

- [ ] `packages/types/package.json` has `"dev": "tsup --watch"`
- [ ] `packages/utils/package.json` has `"dev": "tsup --watch"`
- [ ] `packages/ui/package.json` has `"dev": "tsup --watch"`
- [ ] `packages/db/package.json` has dev script (or uses direct imports)

### 4. Turbo Configuration (`turbo.json`)

- [ ] File exists
- [ ] `dev` task is defined
- [ ] `dev` task has `"cache": false`
- [ ] `dev` task has `"persistent": true`

**Should Look Like:**

```json
"dev": {
  "cache": false,
  "persistent": true
}
```

### 5. Package Exports

Check each package's `package.json`:

- [ ] `packages/types` exports from `dist/` (needs build)
- [ ] `packages/utils` exports from `dist/` (needs build)
- [ ] `packages/ui` exports from `dist/` (needs build)
- [ ] `packages/db` exports from `src/` (direct import) OR `dist/`

### 6. Dockerfiles

- [ ] `apps/api/Dockerfile.dev` exists
- [ ] `apps/web/Dockerfile.dev` exists
- [ ] Both Dockerfiles run `pnpm install`
- [ ] Both Dockerfiles copy workspace files

## Runtime Checks

### 1. Start Services

```bash
pnpm docker:dev
```

- [ ] All containers start successfully
- [ ] No error messages in startup logs
- [ ] Services become healthy (check with `docker-compose -f docker-compose.dev.yml ps`)

### 2. Check Watchers Are Running

```bash
docker-compose -f docker-compose.dev.yml logs api | grep -E "(tsx|tsup)"
docker-compose -f docker-compose.dev.yml logs web | grep -E "(vite|tsup)"
```

- [ ] API logs show `tsx watch` running
- [ ] API logs show `tsup` watching packages
- [ ] Web logs show `vite` running
- [ ] Web logs show `tsup` watching packages

### 3. Test API Hot Reload

1. Edit `apps/api/src/routes/health.ts`
2. Add a comment or change response
3. Save file

- [ ] Logs show "File change detected"
- [ ] API restarts within 1-2 seconds
- [ ] Change is reflected when testing endpoint

### 4. Test Web Hot Reload

1. Edit `apps/web/src/App.tsx`
2. Add a comment or change text
3. Save file

- [ ] Logs show "hmr update"
- [ ] Browser updates instantly (no refresh)
- [ ] Change is visible in browser

### 5. Test Package Hot Reload

1. Edit `packages/types/src/user.ts`
2. Add a comment or new field
3. Save file

- [ ] Logs show `tsup` rebuild (~500ms)
- [ ] Logs show API/Web reload (~1-2s)
- [ ] Total time ~2-3 seconds
- [ ] Change is reflected in apps

## Automated Verification

Run the verification script:

```bash
chmod +x verify-hot-reload.sh
./verify-hot-reload.sh
```

- [ ] All checks pass
- [ ] No failed items
- [ ] Warnings are acceptable (optional features)

## Performance Checks

- [ ] API reload time: 1-2 seconds
- [ ] Web HMR time: Instant
- [ ] Package rebuild + reload: 2-3 seconds
- [ ] CPU usage reasonable (<50% per container)
- [ ] Memory usage stable

## Troubleshooting Checklist

If hot reload isn't working:

- [ ] Restart containers: `docker-compose -f docker-compose.dev.yml restart`
- [ ] Check logs for errors: `docker-compose -f docker-compose.dev.yml logs`
- [ ] Verify file permissions in container
- [ ] Check volume mounts: `docker inspect myorg-api-dev`
- [ ] Rebuild containers: `pnpm docker:dev:build`
- [ ] Check Docker Desktop settings (WSL2, VirtioFS)

## Final Verification

All of the following should work:

- [ ] Edit API source → API restarts
- [ ] Edit Web source → Browser updates via HMR
- [ ] Edit Types package → Apps reload
- [ ] Edit Utils package → Apps reload
- [ ] Edit UI package → Web updates via HMR
- [ ] Edit DB package → Apps reload
- [ ] Multiple rapid changes handled correctly
- [ ] No manual rebuilds needed

## Sign-off

- [ ] Configuration verified
- [ ] All tests passed
- [ ] Hot reload working for apps
- [ ] Hot reload working for packages
- [ ] Performance acceptable
- [ ] Team members can reproduce

**Verified by:** **\*\***\_\_\_**\*\***  
**Date:** **\*\***\_\_\_**\*\***  
**Notes:** **\*\***\_\_\_**\*\***

---

## Quick Reference

**Start development:**

```bash
pnpm docker:dev
```

**View logs:**

```bash
docker-compose -f docker-compose.dev.yml logs -f api
docker-compose -f docker-compose.dev.yml logs -f web
```

**Restart services:**

```bash
docker-compose -f docker-compose.dev.yml restart api web
```

**Rebuild:**

```bash
pnpm docker:dev:build
```

**Stop:**

```bash
docker-compose -f docker-compose.dev.yml down
```

## Documentation

- ✅ [verify-hot-reload.sh](./verify-hot-reload.sh) - Automated verification
- ✅ [HOT_RELOAD_TESTING.md](./HOT_RELOAD_TESTING.md) - Detailed testing guide
- ✅ [DOCKER_DEV_QUICK_START.md](./DOCKER_DEV_QUICK_START.md) - Quick start
- ✅ [DOCKER_HOT_RELOAD.md](./DOCKER_HOT_RELOAD.md) - Complete guide
