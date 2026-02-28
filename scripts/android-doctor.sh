#!/usr/bin/env bash
set -euo pipefail

echo "=== Android Build Environment Check ==="

if command -v java >/dev/null 2>&1; then
  if java -version >/tmp/java-version.out 2>&1; then
    head -n 2 /tmp/java-version.out
  else
    cat /tmp/java-version.out
    echo "[ERROR] Java is installed as a command stub, but runtime is not available."
  fi
else
  echo "[ERROR] Java runtime not found."
fi

if [[ -n "${ANDROID_HOME:-}" ]]; then
  echo "ANDROID_HOME=$ANDROID_HOME"
else
  echo "ANDROID_HOME is not set."
fi

if [[ -n "${ANDROID_SDK_ROOT:-}" ]]; then
  echo "ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT"
else
  echo "ANDROID_SDK_ROOT is not set."
fi

if [[ -d "android" ]]; then
  echo "[OK] android project exists."
else
  echo "[ERROR] android project is missing."
fi
