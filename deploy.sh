#!/bin/bash
set -e

echo "=== ZyNum Deploy ==="

if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm@latest
fi

echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Building frontend (zynum)..."
pnpm --filter @workspace/zynum run build

echo "Building API server..."
pnpm --filter @workspace/api-server run build

echo "=== Deploy complete ==="
echo "Startup file: artifacts/api-server/dist/index.cjs"
