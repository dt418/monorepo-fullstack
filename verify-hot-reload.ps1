# Hot Reload Verification Script (PowerShell)
# This script verifies that Docker hot reload is configured correctly

$ErrorActionPreference = "Continue"

Write-Host "🔍 Hot Reload Configuration Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Counters
$script:PASSED = 0
$script:FAILED = 0
$script:WARNINGS = 0

# Helper functions
function Pass {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
    $script:PASSED++
}

function Fail {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    $script:FAILED++
}

function Warn {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
    $script:WARNINGS++
}

function Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "━━━ $Title ━━━" -ForegroundColor Blue
}

# Check 1: Docker Compose Configuration
Section "1. Docker Compose Configuration"

if (Test-Path "docker-compose.dev.yml") {
    Pass "docker-compose.dev.yml exists"

    $content = Get-Content "docker-compose.dev.yml" -Raw

    # Check API command
    if ($content -match "turbo run dev.*--parallel") {
        Pass "API container uses Turborepo parallel mode"
    } else {
        Fail "API container not using Turborepo parallel mode"
    }

    # Check Web command
    if ($content -match "turbo run dev.*--filter=@myorg/web.*--parallel") {
        Pass "Web container uses Turborepo parallel mode"
    } else {
        Fail "Web container not using Turborepo parallel mode"
    }

    # Check volume mounts
    if ($content -match "\- \.:/app") {
        Pass "Project root mounted as volume"
    } else {
        Fail "Project root not mounted as volume"
    }

    # Check anonymous volumes
    if ($content -match "/app/node_modules") {
        Pass "Anonymous volumes configured for node_modules"
    } else {
        Warn "Anonymous volumes for node_modules not found"
    }
} else {
    Fail "docker-compose.dev.yml not found"
}

# Check 2: Vite Configuration
Section "2. Vite Configuration"

if (Test-Path "apps/web/vite.config.ts") {
    Pass "apps/web/vite.config.ts exists"

    $content = Get-Content "apps/web/vite.config.ts" -Raw

    if ($content -match "host:\s*true") {
        Pass "Vite configured with host: true"
    } else {
        Fail "Vite not configured with host: true"
    }

    if ($content -match "usePolling:\s*true") {
        Pass "Vite configured with usePolling: true"
    } else {
        Fail "Vite not configured with usePolling: true"
    }

    if ($content -match "interval:") {
        Pass "Vite polling interval configured"
    } else {
        Warn "Vite polling interval not explicitly set"
    }
} else {
    Fail "apps/web/vite.config.ts not found"
}

# Check 3: Package Dev Scripts
Section "3. Package Dev Scripts"

function Check-PackageDevScript {
    param([string]$Package)

    $path = "packages/$Package/package.json"

    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        if ($content -match '"dev":\s*".*tsup.*--watch"') {
            Pass "$Package has dev script with tsup --watch"
        } else {
            if ($Package -eq "db") {
                Info "$Package uses direct imports (no build needed)"
            } else {
                Fail "$Package missing dev script with tsup --watch"
            }
        }
    } else {
        Warn "$path not found"
    }
}

Check-PackageDevScript "types"
Check-PackageDevScript "utils"
Check-PackageDevScript "ui"
Check-PackageDevScript "db"

# Check 4: Turbo Configuration
Section "4. Turbo Configuration"

if (Test-Path "turbo.json") {
    Pass "turbo.json exists"

    $content = Get-Content "turbo.json" -Raw

    if ($content -match '"dev":') {
        Pass "dev task configured in turbo.json"

        if ($content -match '"cache":\s*false') {
            Pass "dev task has cache: false"
        } else {
            Warn "dev task might have caching enabled"
        }

        if ($content -match '"persistent":\s*true') {
            Pass "dev task marked as persistent"
        } else {
            Warn "dev task not marked as persistent"
        }
    } else {
        Fail "dev task not configured in turbo.json"
    }
} else {
    Fail "turbo.json not found"
}

# Check 5: Package Exports
Section "5. Package Export Configuration"

function Check-PackageExports {
    param([string]$Package)

    $path = "packages/$Package/package.json"

    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        if ($content -match '"main":\s*"[^"]*dist/') {
            Info "$Package exports from dist/ (needs build)"
        } elseif ($content -match '"main":\s*"[^"]*src/') {
            Info "$Package exports from src/ (direct import)"
        } else {
            Warn "$Package main export not clearly defined"
        }
    }
}

Check-PackageExports "types"
Check-PackageExports "utils"
Check-PackageExports "ui"
Check-PackageExports "db"

# Check 6: Dockerfile Configuration
Section "6. Dockerfile Configuration"

if (Test-Path "apps/api/Dockerfile.dev") {
    Pass "apps/api/Dockerfile.dev exists"

    $content = Get-Content "apps/api/Dockerfile.dev" -Raw
    if ($content -match "pnpm install") {
        Pass "API Dockerfile installs dependencies"
    } else {
        Warn "API Dockerfile might not install dependencies"
    }
} else {
    Fail "apps/api/Dockerfile.dev not found"
}

if (Test-Path "apps/web/Dockerfile.dev") {
    Pass "apps/web/Dockerfile.dev exists"

    $content = Get-Content "apps/web/Dockerfile.dev" -Raw
    if ($content -match "pnpm install") {
        Pass "Web Dockerfile installs dependencies"
    } else {
        Warn "Web Dockerfile might not install dependencies"
    }
} else {
    Fail "apps/web/Dockerfile.dev not found"
}

# Check 7: Environment Files
Section "7. Environment Configuration"

if (Test-Path ".env") {
    Pass ".env file exists"
} else {
    Warn ".env file not found (will use defaults)"
}

if (Test-Path ".env.example") {
    Pass ".env.example exists"
} else {
    Warn ".env.example not found"
}

# Check 8: Docker Installation
Section "8. Docker Installation"

try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Pass "Docker is installed"

        $dockerPs = docker ps 2>$null
        if ($?) {
            Pass "Docker daemon is running"
        } else {
            Fail "Docker daemon is not running"
        }
    } else {
        Fail "Docker is not installed"
    }
} catch {
    Fail "Docker is not installed"
}

try {
    $composeVersion = docker-compose --version 2>$null
    if ($composeVersion) {
        Pass "docker-compose is installed"
    } else {
        Warn "docker-compose not found (might use 'docker compose' instead)"
    }
} catch {
    Warn "docker-compose not found (might use 'docker compose' instead)"
}

# Check 9: pnpm Installation
Section "9. Package Manager"

try {
    $pnpmVersion = pnpm --version 2>$null
    if ($pnpmVersion) {
        Pass "pnpm is installed"
        Info "pnpm version: $pnpmVersion"
    } else {
        Fail "pnpm is not installed"
    }
} catch {
    Fail "pnpm is not installed"
}

# Summary
Section "Summary"

$TOTAL = $script:PASSED + $script:FAILED + $script:WARNINGS
Write-Host ""
Write-Host "Results:"
Write-Host "  Passed:   $($script:PASSED)" -ForegroundColor Green
Write-Host "  Failed:   $($script:FAILED)" -ForegroundColor Red
Write-Host "  Warnings: $($script:WARNINGS)" -ForegroundColor Yellow
Write-Host "  Total:    $TOTAL"
Write-Host ""

if ($script:FAILED -eq 0) {
    Write-Host "✓ Configuration looks good!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Run: pnpm docker:dev"
    Write-Host "  2. Wait for services to start"
    Write-Host "  3. Make a change to test hot reload"
    Write-Host ""
    Write-Host "See DOCKER_DEV_QUICK_START.md for testing instructions"
    exit 0
} else {
    Write-Host "✗ Configuration has issues that need to be fixed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the failed checks above and fix them."
    exit 1
}
