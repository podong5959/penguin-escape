#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/.context/build/ios"
ARCHIVE_PATH="$BUILD_DIR/App.xcarchive"
EXPORT_DIR="$BUILD_DIR/export"
EXPORT_OPTIONS_PLIST="$BUILD_DIR/ExportOptions.plist"
PROJECT_PATH="$ROOT_DIR/ios/App/App.xcodeproj"
SCHEME_NAME="App"
TEAM_ID="${APPLE_TEAM_ID:-YN8CKN8TY6}"
BUNDLE_ID="${IOS_BUNDLE_ID:-com.yeniverseofficial.penguinslide}"

echo "[1/6] Prepare web assets"
cd "$ROOT_DIR"
bash ./scripts/prepare-web-assets.sh

echo "[2/6] Sync iOS platform"
npx cap sync ios

echo "[3/6] Prepare build directories"
mkdir -p "$BUILD_DIR"
rm -rf "$ARCHIVE_PATH" "$EXPORT_DIR"

cat > "$EXPORT_OPTIONS_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>teamID</key>
  <string>${TEAM_ID}</string>
  <key>destination</key>
  <string>export</string>
  <key>uploadSymbols</key>
  <true/>
  <key>uploadBitcode</key>
  <false/>
</dict>
</plist>
EOF

echo "[4/6] Archive iOS app"
xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme "$SCHEME_NAME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  archive

echo "[5/6] Export IPA"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_OPTIONS_PLIST"

IPA_PATH="$(find "$EXPORT_DIR" -maxdepth 1 -name '*.ipa' | head -n 1 || true)"
if [[ -z "$IPA_PATH" || ! -f "$IPA_PATH" ]]; then
  echo "ERROR: IPA export failed. Expected ipa inside: $EXPORT_DIR"
  exit 1
fi

echo "[6/6] Done"
echo "Bundle ID: $BUNDLE_ID"
echo "Archive: $ARCHIVE_PATH"
echo "IPA: $IPA_PATH"
ls -lh "$IPA_PATH"
