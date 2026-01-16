# Hot Reload Testing Guide

This guide helps you verify that hot reload is working correctly in your Docker development environment.

## Quick Verification

Run the automated verification script:

```bash
# Make script executable
chmod +x verify-hot-reload.sh

# Run verification
./verify-hot-reload.sh
```

This will check:

- ✅ Docker Compose configuration
- ✅ Vite configuration
- ✅ Package dev scripts
- ✅ Turbo configuration
- ✅ Package exports
- ✅ Dockerfile setup
- ✅ Environment files
- ✅ Docker installation
- ✅ pnpm installation

## Manual Testing

### Step 1: Start Development Environment

```bash
# Start all services
pnpm docker:dev
```

**Expected output:**

```text
✓ Creating network "myorg-network-dev"
✓ Creating myorg-postgres-dev
✓ Creating myorg-redis-dev
✓ Creating myorg-api-dev
✓ Creating myorg-web-dev
✓ Creating myorg-prisma-studio-dev
```

Wait for services to be healthy (30-60 seconds).

### Step 2: Check Service Health

Open another terminal and run:

```bash
# Check all containers are running
docker-compose -f docker-compose.dev.yml ps
```

**Expected output:**

```text
NAME                    STATUS              PORTS
myorg-api-dev          Up (healthy)        0.0.0.0:3001->3001/tcp
myorg-web-dev          Up (healthy)        0.0.0.0:5173->5173/tcp
myorg-postgres-dev     Up (healthy)        0.0.0.0:5432->5432/tcp
myorg-redis-dev        Up (healthy)        0.0.0.0:6379->6379/tcp
myorg-prisma-studio-dev Up                 0.0.0.0:5555->5555/tcp
```

### Step 3: Verify Services Are Accessible

```bash
# Check API health
curl http://localhost:3001/health

# Expected: {"status":"ok"}

# Check Web is serving
curl http://localhost:5173

# Expected: HTML content
```

### Step 4: Test API Hot Reload

#### 4.1 Watch API Logs

```bash
docker-compose -f docker-compose.dev.yml logs -f api
```

#### 4.2 Make a Change

Edit `apps/api/src/routes/health.ts`:

```typescript
// Before
export const healthRoutes = new Hono().get('/health', (c) => c.json({ status: 'ok' }));

// After
export const healthRoutes = new Hono().get('/health', (c) =>
  c.json({ status: 'ok', timestamp: Date.now() })
);
```

#### 4.3 Verify Reload

**Expected in logs:**

```text
[tsx] File change detected. Restarting...
[tsx] Restarted
API Server running on port 3001
```

**Time:** ~1-2 seconds

#### 4.4 Test the Change

```bash
curl http://localhost:3001/health
```

**Expected:**

```json
{ "status": "ok", "timestamp": 1234567890 }
```

✅ **API hot reload works!**

### Step 5: Test Web Hot Reload

#### 5.1 Watch Web Logs

```bash
docker-compose -f docker-compose.dev.yml logs -f web
```

#### 5.2 Make a Change

Edit `apps/web/src/App.tsx`:

```tsx
// Add a test message
<div>
  <h1>MyOrg App</h1>
  <p>Hot Reload Test - {new Date().toISOString()}</p>
</div>
```

#### 5.3 Verify Reload

**Expected in logs:**

```text
[vite] hmr update /src/App.tsx
```

**In browser:** Page updates instantly without refresh

**Time:** Instant (HMR)

✅ **Web hot reload works!**

### Step 6: Test Package Hot Reload (Types)

#### 6.1 Watch Both API and Web Logs

```bash
# Terminal 1
docker-compose -f docker-compose.dev.yml logs -f api

# Terminal 2
docker-compose -f docker-compose.dev.yml logs -f web
```

#### 6.2 Make a Change to Types Package

Edit `packages/types/src/user.ts`:

```typescript
// Add a new field
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  testField: z.string().optional(), // NEW FIELD
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

#### 6.3 Verify Package Rebuild

**Expected in logs:**

```text
# In both API and Web logs:
[tsup] Build success in XXXms
```

**Time:** ~500ms for package rebuild

#### 6.4 Verify App Reload

**Expected in API logs:**

```text
[tsx] File change detected. Restarting...
[tsx] Restarted
```

**Expected in Web logs:**

```text
[vite] hmr update /node_modules/@myorg/types/dist/index.js
```

**Total time:** ~2-3 seconds

✅ **Package hot reload works!**

### Step 7: Test Package Hot Reload (Utils)

#### 7.1 Make a Change to Utils Package

Edit `packages/utils/src/logger.ts`:

```typescript
// Add a new log level
export const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
  debug: (msg: string) => console.log(`[DEBUG] ${msg}`), // NEW
};
```

#### 7.2 Verify Rebuild and Reload

**Expected:** Same pattern as types package

- Package rebuilds (~500ms)
- Apps reload (~1-2s)
- Total: ~2-3s

✅ **Utils package hot reload works!**

### Step 8: Test Package Hot Reload (UI)

#### 8.1 Make a Change to UI Package

Edit `packages/ui/src/Button.tsx` (or any UI component):

```tsx
// Add a data attribute
export const Button = ({ children, ...props }) => (
  <button {...props} data-test="hot-reload">
    {children}
  </button>
);
```

#### 8.2 Verify Rebuild and HMR

**Expected in Web logs:**

```text
[tsup] Build success in XXXms
[vite] hmr update /node_modules/@myorg/ui/dist/index.js
```

**In browser:** Component updates instantly

✅ **UI package hot reload works!**

## Troubleshooting Tests

### Test 1: Check Watchers Are Running

```bash
# Check if tsup watchers are running
docker-compose -f docker-compose.dev.yml exec api ps aux | grep tsup

# Expected: Multiple tsup processes
```

### Test 2: Check File Permissions

```bash
# Check if files are writable in container
docker-compose -f docker-compose.dev.yml exec api ls -la /app/packages/types/src/

# Expected: Files owned by node user or root with write permissions
```

### Test 3: Check Volume Mounts

```bash
# Inspect API container volumes
docker inspect myorg-api-dev | grep -A 20 "Mounts"

# Expected: Source: /path/to/your/project, Destination: /app
```

### Test 4: Check Polling Configuration

```bash
# Check Vite config in container
docker-compose -f docker-compose.dev.yml exec web cat /app/apps/web/vite.config.ts | grep -A 5 "watch"

# Expected: usePolling: true, interval: 1000
```

### Test 5: Force Rebuild Test

```bash
# Force rebuild a package
docker-compose -f docker-compose.dev.yml exec api pnpm --filter @myorg/types build

# Expected: Build success message
```

## Performance Benchmarks

Run these tests to measure hot reload performance:

### Benchmark 1: API Source Change

```bash
# Time the reload
time (echo "// test" >> apps/api/src/routes/health.ts && sleep 3)

# Expected: ~1-2 seconds until API restarts
```

### Benchmark 2: Web Source Change

```bash
# Time the HMR
time (echo "// test" >> apps/web/src/App.tsx && sleep 2)

# Expected: ~1 second until HMR update
```

### Benchmark 3: Package Change

```bash
# Time the package rebuild + app reload
time (echo "// test" >> packages/types/src/user.ts && sleep 4)

# Expected: ~2-3 seconds until apps reload
```

## Common Issues and Solutions

### Issue 1: Changes Not Detected

**Symptoms:**

- Edit file, no reload happens
- No output in logs

**Solutions:**

```bash
# 1. Restart containers
docker-compose -f docker-compose.dev.yml restart api web

# 2. Check logs for errors
docker-compose -f docker-compose.dev.yml logs api | tail -50

# 3. Rebuild containers
pnpm docker:dev:build
```

### Issue 2: Slow Hot Reload

**Symptoms:**

- Changes take >5 seconds to reflect

**Solutions:**

```bash
# 1. Check CPU usage
docker stats

# 2. Adjust Vite polling interval (in vite.config.ts)
watch: {
  interval: 2000,  // Increase to reduce CPU usage
}

# 3. Use Docker Desktop with WSL2 (Windows) or VirtioFS (Mac)
```

### Issue 3: Package Changes Not Reflected

**Symptoms:**

- Change package file, apps don't reload

**Solutions:**

```bash
# 1. Check if tsup is running
docker-compose -f docker-compose.dev.yml logs api | grep tsup

# 2. Check if dist/ is being updated
docker-compose -f docker-compose.dev.yml exec api ls -la /app/packages/types/dist/

# 3. Force rebuild
docker-compose -f docker-compose.dev.yml exec api pnpm --filter @myorg/types build

# 4. Restart container
docker-compose -f docker-compose.dev.yml restart api
```

### Issue 4: Port Conflicts

**Symptoms:**

- Error: "port is already allocated"

**Solutions:**

```bash
# 1. Check what's using the port
lsof -i :3001  # or :5173

# 2. Update .env with different ports
echo "API_PORT=3002" >> .env
echo "WEB_PORT=5174" >> .env

# 3. Restart
pnpm docker:dev
```

## Success Criteria

Your hot reload is working correctly if:

- ✅ API changes reload in 1-2 seconds
- ✅ Web changes update instantly via HMR
- ✅ Package changes rebuild and reload apps in 2-3 seconds
- ✅ No manual rebuilds needed
- ✅ Logs show file change detection
- ✅ All services remain healthy

## Next Steps

Once all tests pass:

1. Start coding with confidence
2. Monitor logs occasionally to ensure watchers are running
3. Restart containers if you encounter issues
4. Rebuild containers after major dependency changes

## Automated Testing Script

For continuous verification, you can create a test script:

```bash
#!/bin/bash
# test-hot-reload.sh

echo "Testing API hot reload..."
echo "// test $(date +%s)" >> apps/api/src/routes/health.ts
sleep 3
curl -s http://localhost:3001/health | grep -q "ok" && echo "✓ API works"

echo "Testing package hot reload..."
echo "// test $(date +%s)" >> packages/types/src/user.ts
sleep 4
curl -s http://localhost:3001/health | grep -q "ok" && echo "✓ Package reload works"

echo "All tests passed!"
```

Run with:

```bash
chmod +x test-hot-reload.sh
./test-hot-reload.sh
```

## Documentation

- [DOCKER_DEV_QUICK_START.md](./DOCKER_DEV_QUICK_START.md) - Quick reference
- [DOCKER_HOT_RELOAD.md](./DOCKER_HOT_RELOAD.md) - Complete guide
- [CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md) - Technical details
