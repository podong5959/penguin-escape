#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_IPA_PATH="$ROOT_DIR/.context/build/ios/export/App.ipa"
IPA_PATH="${1:-${IPA_PATH:-$DEFAULT_IPA_PATH}}"

if [[ ! -f "$IPA_PATH" ]]; then
  echo "ERROR: IPA not found: $IPA_PATH"
  echo "Tip: run 'npm run ios:archive:release' first."
  exit 1
fi

API_KEY_ID="${APP_STORE_CONNECT_API_KEY_ID:-}"
API_ISSUER_ID="${APP_STORE_CONNECT_API_ISSUER_ID:-}"
API_KEY_PATH="${APP_STORE_CONNECT_API_KEY_PATH:-}"

if [[ -z "$API_KEY_ID" || -z "$API_ISSUER_ID" || -z "$API_KEY_PATH" ]]; then
  cat <<EOF
ERROR: Missing API key env vars.
Required:
  APP_STORE_CONNECT_API_KEY_ID
  APP_STORE_CONNECT_API_ISSUER_ID
  APP_STORE_CONNECT_API_KEY_PATH

Example:
  export APP_STORE_CONNECT_API_KEY_ID=ABCD123456
  export APP_STORE_CONNECT_API_ISSUER_ID=11111111-2222-3333-4444-555555555555
  export APP_STORE_CONNECT_API_KEY_PATH=\$HOME/keys/AuthKey_ABCD123456.p8
EOF
  exit 1
fi

if [[ ! -f "$API_KEY_PATH" ]]; then
  echo "ERROR: API key file not found: $API_KEY_PATH"
  exit 1
fi

echo "[1/2] Upload IPA to App Store Connect (TestFlight processing)"
xcrun altool \
  --upload-app \
  --type ios \
  --file "$IPA_PATH" \
  --apiKey "$API_KEY_ID" \
  --apiIssuer "$API_ISSUER_ID" \
  --verbose

echo "[2/2] Done"
echo "Uploaded: $IPA_PATH"
echo "Next: Check App Store Connect > TestFlight for processing status."
