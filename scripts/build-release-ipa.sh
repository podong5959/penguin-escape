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
BUILD_SHA="$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo unknown)"

echo "[NOTICE] iOS 버그 수정분 반영 재배포 안내"
echo "이번 IPA는 최신 코드(커밋: $BUILD_SHA) 기준으로 생성됩니다."
echo "Xcode 수동 배포 대신 이 스크립트로 재배포하면 최신 수정분이 반영됩니다."

echo "[1/6] Prepare web assets"
cd "$ROOT_DIR"
bash ./scripts/prepare-web-assets.sh

echo "[2/6] Sync iOS platform"
node ./node_modules/@capacitor/cli/bin/capacitor sync ios

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
