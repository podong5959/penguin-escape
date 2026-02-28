#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WWW_DIR="$ROOT_DIR/www"

rm -rf "$WWW_DIR"
mkdir -p "$WWW_DIR"

# Copy static web game assets that should be bundled into the Android WebView app.
cp "$ROOT_DIR/index.html" "$WWW_DIR/"
cp "$ROOT_DIR/game.js" "$WWW_DIR/"
cp "$ROOT_DIR/ad-adapter.js" "$WWW_DIR/"
cp "$ROOT_DIR/supabase-adapter.js" "$WWW_DIR/"
cp "$ROOT_DIR/stages.json" "$WWW_DIR/"
cp "$ROOT_DIR/privacy.html" "$WWW_DIR/"
cp "$ROOT_DIR/account-deletion.html" "$WWW_DIR/"
cp -R "$ROOT_DIR/asset" "$WWW_DIR/"

echo "[INFO] Web assets prepared in $WWW_DIR"
