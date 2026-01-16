#!/bin/bash

# Hot Reload Verification Script
# This script verifies that Docker hot reload is configured correctly

set -e

echo "🔍 Hot Reload Configuration Verification"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

section() {
    echo ""
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

# Check 1: Docker Compose Configuration
section "1. Docker Compose Configuration"

if [ -f "docker-compose.dev.yml" ]; then
    pass "docker-compose.dev.yml exists"

    # Check API command
    if grep -q "turbo run dev.*--parallel" docker-compose.dev.yml; then
        pass "API container uses Turborepo parallel mode"
    else
        fail "API container not using Turborepo parallel mode"
    fi

    # Check Web command
    if grep -q "turbo run dev.*--filter=@myorg/web.*--parallel" docker-compose.dev.yml; then
        pass "Web container uses Turborepo parallel mode"
    else
        fail "Web container not using Turborepo parallel mode"
    fi

    # Check volume mounts
    if grep -q "\- \.:/app" docker-compose.dev.yml; then
        pass "Project root mounted as volume"
    else
        fail "Project root not mounted as volume"
    fi

    # Check anonymous volumes
    if grep -q "/app/node_modules" docker-compose.dev.yml; then
        pass "Anonymous volumes configured for node_modules"
    else
        warn "Anonymous volumes for node_modules not found"
    fi
else
    fail "docker-compose.dev.yml not found"
fi

# Check 2: Vite Configuration
section "2. Vite Configuration"

if [ -f "apps/web/vite.config.ts" ]; then
    pass "apps/web/vite.config.ts exists"

    if grep -q "host: true" apps/web/vite.config.ts; then
        pass "Vite configured with host: true"
    else
        fail "Vite not configured with host: true"
    fi

    if grep -q "usePolling: true" apps/web/vite.config.ts; then
        pass "Vite configured with usePolling: true"
    else
        fail "Vite not configured with usePolling: true"
    fi

    if grep -q "interval:" apps/web/vite.config.ts; then
        pass "Vite polling interval configured"
    else
        warn "Vite polling interval not explicitly set"
    fi
else
    fail "apps/web/vite.config.ts not found"
fi

# Check 3: Package Dev Scripts
section "3. Package Dev Scripts"

check_package_dev_script() {
    local package=$1
    local path="packages/$package/package.json"

    if [ -f "$path" ]; then
        if grep -q '"dev":.*"tsup --watch"' "$path" || grep -q '"dev":.*"tsup.*watch"' "$path"; then
            pass "$package has dev script with tsup --watch"
        else
            if [ "$package" = "db" ]; then
                info "$package uses direct imports (no build needed)"
            else
                fail "$package missing dev script with tsup --watch"
            fi
        fi
    else
        warn "$path not found"
    fi
}

check_package_dev_script "types"
check_package_dev_script "utils"
check_package_dev_script "ui"
check_package_dev_script "db"

# Check 4: Turbo Configuration
section "4. Turbo Configuration"

if [ -f "turbo.json" ]; then
    pass "turbo.json exists"

    if grep -q '"dev":' turbo.json; then
        pass "dev task configured in turbo.json"

        if grep -q '"cache": false' turbo.json; then
            pass "dev task has cache: false"
        else
            warn "dev task might have caching enabled"
        fi

        if grep -q '"persistent": true' turbo.json; then
            pass "dev task marked as persistent"
        else
            warn "dev task not marked as persistent"
        fi
    else
        fail "dev task not configured in turbo.json"
    fi
else
    fail "turbo.json not found"
fi

# Check 5: Package Exports
section "5. Package Export Configuration"

check_package_exports() {
    local package=$1
    local path="packages/$package/package.json"

    if [ -f "$path" ]; then
        if grep -q '"main":.*"dist/' "$path" || grep -q '"main":.*"src/' "$path"; then
            local export_path=$(grep '"main":' "$path" | head -1)
            if [[ $export_path == *"dist/"* ]]; then
                info "$package exports from dist/ (needs build)"
            else
                info "$package exports from src/ (direct import)"
            fi
        else
            warn "$package main export not clearly defined"
        fi
    fi
}

check_package_exports "types"
check_package_exports "utils"
check_package_exports "ui"
check_package_exports "db"

# Check 6: Dockerfile Configuration
section "6. Dockerfile Configuration"

if [ -f "apps/api/Dockerfile.dev" ]; then
    pass "apps/api/Dockerfile.dev exists"

    if grep -q "pnpm install" apps/api/Dockerfile.dev; then
        pass "API Dockerfile installs dependencies"
    else
        warn "API Dockerfile might not install dependencies"
    fi
else
    fail "apps/api/Dockerfile.dev not found"
fi

if [ -f "apps/web/Dockerfile.dev" ]; then
    pass "apps/web/Dockerfile.dev exists"

    if grep -q "pnpm install" apps/web/Dockerfile.dev; then
        pass "Web Dockerfile installs dependencies"
    else
        warn "Web Dockerfile might not install dependencies"
    fi
else
    fail "apps/web/Dockerfile.dev not found"
fi

# Check 7: Environment Files
section "7. Environment Configuration"

if [ -f ".env" ]; then
    pass ".env file exists"
else
    warn ".env file not found (will use defaults)"
fi

if [ -f ".env.example" ]; then
    pass ".env.example exists"
else
    warn ".env.example not found"
fi

# Check 8: Docker Installation
section "8. Docker Installation"

if command -v docker &> /dev/null; then
    pass "Docker is installed"

    if docker ps &> /dev/null; then
        pass "Docker daemon is running"
    else
        fail "Docker daemon is not running"
    fi
else
    fail "Docker is not installed"
fi

if command -v docker-compose &> /dev/null; then
    pass "docker-compose is installed"
else
    warn "docker-compose not found (might use 'docker compose' instead)"
fi

# Check 9: pnpm Installation
section "9. Package Manager"

if command -v pnpm &> /dev/null; then
    pass "pnpm is installed"

    pnpm_version=$(pnpm --version)
    info "pnpm version: $pnpm_version"
else
    fail "pnpm is not installed"
fi

# Summary
section "Summary"

TOTAL=$((PASSED + FAILED + WARNINGS))
echo ""
echo "Results:"
echo -e "  ${GREEN}Passed:${NC}   $PASSED"
echo -e "  ${RED}Failed:${NC}   $FAILED"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "  Total:    $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Configuration looks good!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run: pnpm docker:dev"
    echo "  2. Wait for services to start"
    echo "  3. Make a change to test hot reload"
    echo ""
    echo "See DOCKER_DEV_QUICK_START.md for testing instructions"
    exit 0
else
    echo -e "${RED}✗ Configuration has issues that need to be fixed${NC}"
    echo ""
    echo "Please review the failed checks above and fix them."
    exit 1
fi
