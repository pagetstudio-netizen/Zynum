#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=== ZyNum Deploy ==="
echo "Node: $(node -v)"
echo "NPM:  $(npm -v)"
echo "Repository: $ROOT_DIR"

# ── 1. pnpm ───────────────────────────────────────────────────────────────────
if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm@10
fi
echo "pnpm: $(pnpm -v)"

# ── 2. Dependencies ───────────────────────────────────────────────────────────
echo "Installing dependencies..."
pnpm install --frozen-lockfile --prod=false

# ── 3. Frontend + API server ───────────────────────────────────────────────────
echo "Building frontend and API server..."
pnpm run build

test -s artifacts/api-server/dist/index.cjs || {
  echo "Build failed: API startup bundle is missing." >&2
  exit 1
}
test -s artifacts/api-server/dist/public/index.html || {
  echo "Build failed: frontend entry point is missing." >&2
  exit 1
}

echo ""
echo "=== Build complete ==="
echo ""
echo "  Startup command : NODE_ENV=production node app.js"
echo "  Static files    : artifacts/api-server/dist/public/"
echo ""
