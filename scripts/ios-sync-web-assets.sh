#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_PUBLIC_DIR="$REPO_ROOT/ios/App/App/public"

# Build the canonical web bundle from root sources.
bash "$REPO_ROOT/scripts/prepare-web-assets.sh"

# Keep Capacitor iOS public assets aligned with latest root web assets.
mkdir -p "$IOS_PUBLIC_DIR"
rsync -a --delete "$REPO_ROOT/www/" "$IOS_PUBLIC_DIR/"

echo "[INFO] iOS public assets synced from $REPO_ROOT/www to $IOS_PUBLIC_DIR"
