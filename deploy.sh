#!/bin/bash
set -e

echo "=== ZyNum Deploy Script ==="

if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm@latest
fi

echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Building project..."
pnpm run build

echo "=== Deploy complete ==="
echo "Startup file: artifacts/api-server/dist/index.cjs"
