#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_SOURCE_DIR="$APP_DIR/vendor/swiss-ephemeris"
BUILD_SOURCE_DIR="$APP_DIR/vendor/swiss-ephemeris-netlify-src"
OUT_DIR="$APP_DIR/netlify/swiss"
OUT_EPHE_DIR="$OUT_DIR/ephe"

echo "== Netlify Swiss Ephemeris minimal runtime setup =="

if [ -f "$LOCAL_SOURCE_DIR/swetest.c" ] && [ -f "$LOCAL_SOURCE_DIR/swephexp.h" ]; then
  SRC_DIR="$LOCAL_SOURCE_DIR"
else
  SRC_DIR="$BUILD_SOURCE_DIR"
  if [ ! -d "$SRC_DIR/.git" ]; then
    rm -rf "$SRC_DIR"
    git clone --depth 1 --filter=blob:none --sparse https://github.com/aloistr/swisseph.git "$SRC_DIR"
    (
      cd "$SRC_DIR"
      git sparse-checkout init --no-cone
      {
        echo "/*"
        echo "!/ephe/*"
        echo "/ephe/sepl_18.se1"
        echo "/ephe/semo_18.se1"
      } > .git/info/sparse-checkout
      git checkout
    )
  fi
fi

if [ ! -f "$SRC_DIR/swetest.c" ] || [ ! -f "$SRC_DIR/swephexp.h" ]; then
  echo "ERROR: Swiss Ephemeris source files are missing in $SRC_DIR" >&2
  exit 1
fi

make -C "$SRC_DIR" -B swetest

SWETEST_BIN="$SRC_DIR/swetest"
if [ ! -x "$SWETEST_BIN" ] && [ -x "$SRC_DIR/bin/swetest" ]; then
  SWETEST_BIN="$SRC_DIR/bin/swetest"
fi
if [ ! -x "$SWETEST_BIN" ]; then
  echo "ERROR: swetest binary was not created" >&2
  exit 1
fi

mkdir -p "$OUT_EPHE_DIR"
cp "$SWETEST_BIN" "$OUT_DIR/swetest"
chmod 755 "$OUT_DIR/swetest"

for ephe_file in sepl_18.se1 semo_18.se1; do
  if [ ! -f "$SRC_DIR/ephe/$ephe_file" ]; then
    echo "ERROR: required ephemeris file missing: $SRC_DIR/ephe/$ephe_file" >&2
    exit 1
  fi
  cp "$SRC_DIR/ephe/$ephe_file" "$OUT_EPHE_DIR/$ephe_file"
done

echo "Prepared minimal Swiss runtime:"
du -sh "$OUT_DIR" || true
echo "SWETEST_PATH=$OUT_DIR/swetest"
echo "SWISS_EPHEMERIS_PATH=$OUT_EPHE_DIR"
