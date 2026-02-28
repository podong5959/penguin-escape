#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if ! npx vercel whoami >/dev/null 2>&1; then
  echo "[ERROR] Vercel login is required."
  echo "Run: npx vercel login"
  exit 1
fi

echo "[INFO] Deploying production build to Vercel..."
npx vercel --prod --yes "$@"
