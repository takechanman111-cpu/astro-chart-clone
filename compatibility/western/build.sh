#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p runtime/ephe
if [[ "$(uname -s)" == Linux ]]; then
  make -C swiss-source -B swetest.o libswe.a
  "${CC:-cc}" -static -o runtime/swetest swiss-source/swetest.o -Lswiss-source -lswe -lm
  if command -v file >/dev/null; then
    file runtime/swetest | grep -Eq 'ELF .*statically linked'
  fi
else
  make -C swiss-source -B swetest
  install -m 755 swiss-source/swetest runtime/swetest
fi
cp swiss-source/ephe/{sepl_18,semo_18}.se1 runtime/ephe/
SWETEST_PATH="$PWD/runtime/swetest" SWISS_EPHEMERIS_PATH="$PWD/runtime/ephe" node --test scripts/check.mjs
