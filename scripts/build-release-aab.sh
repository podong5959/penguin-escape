#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AAB_PATH="$ROOT_DIR/android/app/build/outputs/bundle/release/app-release.aab"

echo "[1/3] Prepare web assets"
cd "$ROOT_DIR"
bash ./scripts/prepare-web-assets.sh

echo "[2/3] Capacitor sync"
npx cap sync android

echo "[3/3] Build Android release AAB"
cd "$ROOT_DIR/android"
./gradlew bundleRelease --console=plain

echo "[4/4] Verify output"
if [[ ! -f "$AAB_PATH" ]]; then
  echo "ERROR: AAB not found at: $AAB_PATH"
  exit 1
fi

ls -lh "$AAB_PATH"
if command -v stat >/dev/null 2>&1; then
  /usr/bin/stat -f "Updated: %Sm" -t "%Y-%m-%d %H:%M:%S" "$AAB_PATH" 2>/dev/null || true
fi

echo "Done: $AAB_PATH"
