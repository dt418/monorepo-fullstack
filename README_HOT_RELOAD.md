# 🔥 Hot Reload Setup - Complete Guide

Your Docker + Turborepo hot reload is fully configured! This guide helps you verify and use it.

## ⚡ Quick Verification

Run the verification script to check your configuration:

### Windows (PowerShell)

```powershell
.\verify-hot-reload.ps1
```

### Linux/Mac (Bash)

```bash
chmod +x verify-hot-reload.sh
./verify-hot-reload.sh
```

**Expected Result:**

```text
✓ Configuration looks good!
Passed: 26+, Failed: 0
```

## 🚀 Usage

### Start Development

```bash
pnpm docker:dev
```

Wait 30-60 seconds for services to start.

### Verify Services

```bash
# Check all containers are running
docker-compose -f docker-compose.dev.yml ps

# Test API
curl http://localhost:3001/health

# Open Web
# http://localhost:5173
```

### Make Changes

| Change Location     | Reload Time | Method                |
| ------------------- | ----------- | --------------------- |
| `apps/api/src/**`   | 1-2 seconds | tsx watch restarts    |
| `apps/web/src/**`   | Instant     | Vite HMR              |
| `packages/*/src/**` | 2-3 seconds | tsup rebuild + reload |

**All changes are automatic - no manual rebuilds needed!**

## 📊 What's Configured

### Architecture

```text
Docker Containers
├── API Container
│   └── Turborepo --parallel
│       ├── tsx watch (API server)
│       ├── tsup --watch (types package)
│       ├── tsup --watch (utils package)
│       └── Direct import (db package)
│
└── Web Container
    └── Turborepo --parallel
        ├── Vite HMR (Web app)
        ├── tsup --watch (ui package)
        ├── tsup --watch (types package)
        └── tsup --watch (utils package)
```

### Key Features

✅ **Volume Mounts**: Your code syncs to containers  
✅ **File Watching**: Detects changes via polling  
✅ **Parallel Execution**: All watchers run simultaneously  
✅ **Auto Rebuild**: Packages rebuild on change  
✅ **Auto Reload**: Apps reload with new code

## 🧪 Testing

### Test 1: API Hot Reload

```bash
# Terminal 1: Watch logs
docker-compose -f docker-compose.dev.yml logs -f api

# Terminal 2: Make change
echo "// test" >> apps/api/src/routes/health.ts

# Expected: API restarts in 1-2 seconds
```

### Test 2: Web Hot Reload

```bash
# Terminal 1: Watch logs
docker-compose -f docker-compose.dev.yml logs -f web

# Terminal 2: Make change
echo "// test" >> apps/web/src/App.tsx

# Expected: Browser updates instantly via HMR
```

### Test 3: Package Hot Reload

```bash
# Terminal 1: Watch logs
docker-compose -f docker-compose.dev.yml logs -f api

# Terminal 2: Make change
echo "// test" >> packages/types/src/user.ts

# Expected:
# 1. tsup rebuilds package (~500ms)
# 2. API restarts (~1-2s)
# Total: ~2-3 seconds
```

## 🔧 Troubleshooting

### Changes Not Detected?

```bash
# Restart containers
docker-compose -f docker-compose.dev.yml restart api web

# Check logs for errors
docker-compose -f docker-compose.dev.yml logs api | tail -50

# Rebuild if needed
pnpm docker:dev:build
```

### Slow Performance?

```bash
# Check resource usage
docker stats

# Adjust polling interval in apps/web/vite.config.ts
watch: {
  interval: 2000,  // Increase to reduce CPU
}
```

### Package Changes Not Working?

```bash
# Check if tsup is running
docker-compose -f docker-compose.dev.yml logs api | grep tsup

# Force rebuild package
docker-compose -f docker-compose.dev.yml exec api pnpm --filter @myorg/types build
```

## 📚 Documentation

| Document                                                     | Purpose                     |
| ------------------------------------------------------------ | --------------------------- |
| **[VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md)**         | How to verify configuration |
| **[HOT_RELOAD_TESTING.md](./HOT_RELOAD_TESTING.md)**         | Detailed testing guide      |
| **[HOT_RELOAD_CHECKLIST.md](./HOT_RELOAD_CHECKLIST.md)**     | Manual checklist            |
| **[DOCKER_DEV_QUICK_START.md](./DOCKER_DEV_QUICK_START.md)** | Quick reference             |
| **[DOCKER_HOT_RELOAD.md](./DOCKER_HOT_RELOAD.md)**           | Complete guide              |
| **[CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md)**               | Technical details           |

## 🎯 Quick Commands

```bash
# Start development
pnpm docker:dev

# View logs (all services)
docker-compose -f docker-compose.dev.yml logs -f

# View logs (specific service)
docker-compose -f docker-compose.dev.yml logs -f api
docker-compose -f docker-compose.dev.yml logs -f web

# Restart services
docker-compose -f docker-compose.dev.yml restart api web

# Rebuild containers
pnpm docker:dev:build

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Check container status
docker-compose -f docker-compose.dev.yml ps

# Check resource usage
docker stats
```

## ✅ Success Criteria

Your hot reload is working when:

- ✅ Verification script passes (0 failures)
- ✅ All containers start and become healthy
- ✅ API changes reload in 1-2 seconds
- ✅ Web changes update instantly
- ✅ Package changes reload in 2-3 seconds
- ✅ No manual rebuilds needed
- ✅ Logs show file change detection

## 🚦 Getting Started

1. **Verify Configuration**

   ```bash
   .\verify-hot-reload.ps1  # Windows
   ./verify-hot-reload.sh   # Linux/Mac
   ```

2. **Start Docker Desktop** (if not running)

3. **Start Development**

   ```bash
   pnpm docker:dev
   ```

4. **Wait for Services** (30-60 seconds)

5. **Test Hot Reload** (make a change)

6. **Start Coding!** 🎉

## 💡 Tips

- **Keep containers running** - No need to restart for code changes
- **Watch the logs** - See real-time feedback
- **Use Prisma Studio** - Visual DB editor at <http://localhost:5555>
- **Check health** - API health at <http://localhost:3001/health>
- **Monitor resources** - Use `docker stats` to check performance

## 🆘 Need Help?

1. Run verification: `.\verify-hot-reload.ps1`
2. Check [VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md)
3. Review [HOT_RELOAD_TESTING.md](./HOT_RELOAD_TESTING.md)
4. Check Docker Desktop settings (WSL2, VirtioFS)
5. Rebuild: `pnpm docker:dev:build`

## 🎉 You're Ready

Your hot reload is configured and ready to use. Just run `pnpm docker:dev` and start coding!

Changes to any file in `apps/` or `packages/` will automatically reload. No manual rebuilds needed. 🚀
