#!/bin/bash
set -e

echo "=== ZyNum Deploy ==="
echo "Node: $(node -v)"
echo "NPM:  $(npm -v)"

# ── 1. pnpm ───────────────────────────────────────────────────────────────────
if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm@10
fi
echo "pnpm: $(pnpm -v)"

# ── 2. Dependencies ───────────────────────────────────────────────────────────
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# ── 3. Frontend (Vite) ────────────────────────────────────────────────────────
echo "Building frontend..."
pnpm --filter @workspace/zynum run build

# ── 4. API server (esbuild → dist/index.cjs) ─────────────────────────────────
echo "Building API server..."
pnpm --filter @workspace/api-server run build

echo ""
echo "=== Build complete ==="
echo ""
echo "  Startup command : node artifacts/api-server/dist/index.cjs"
echo "  Static files    : artifacts/api-server/dist/public/"
echo ""
