#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "== Swiss Ephemeris setup =="
echo "App: $APP_DIR"

mkdir -p vendor

if [ ! -d "vendor/swiss-ephemeris/.git" ]; then
  echo "Downloading official Swiss Ephemeris source..."
  git clone https://github.com/aloistr/swisseph.git vendor/swiss-ephemeris
else
  echo "Swiss Ephemeris source already exists. Updating..."
  if ! git -C vendor/swiss-ephemeris pull --ff-only; then
    echo "WARNING: Could not update from GitHub. Continuing with the existing local source."
  fi
fi

if [ ! -f "vendor/swiss-ephemeris/swephexp.h" ] || [ ! -f "vendor/swiss-ephemeris/swetest.c" ]; then
  echo "Swiss source files are incomplete. Restoring missing files from the local git checkout..."
  git -C vendor/swiss-ephemeris archive HEAD | tar -x -C vendor/swiss-ephemeris
fi

echo "Building swetest..."
make -C vendor/swiss-ephemeris swetest

if [ -x "$APP_DIR/vendor/swiss-ephemeris/swetest" ]; then
  SWETEST_PATH="$APP_DIR/vendor/swiss-ephemeris/swetest"
elif [ -x "$APP_DIR/vendor/swiss-ephemeris/bin/swetest" ]; then
  SWETEST_PATH="$APP_DIR/vendor/swiss-ephemeris/bin/swetest"
else
  SWETEST_PATH="$APP_DIR/vendor/swiss-ephemeris/swetest"
fi
SWISS_EPHEMERIS_PATH="$APP_DIR/vendor/swiss-ephemeris/ephe"

if [ ! -x "$SWETEST_PATH" ]; then
  echo "ERROR: swetest was not created at $SWETEST_PATH" >&2
  exit 1
fi

echo "Checking Swiss runtime..."
SWETEST_PATH="$SWETEST_PATH" \
SWISS_EPHEMERIS_PATH="$SWISS_EPHEMERIS_PATH" \
npm run check:swiss

echo "Checking strict reference compatibility..."
SWETEST_PATH="$SWETEST_PATH" \
SWISS_EPHEMERIS_PATH="$SWISS_EPHEMERIS_PATH" \
npm run check:timing:strict

echo "Done."
