# AGPL / Swiss Ephemeris Plan

This project can move to Swiss Ephemeris Free Edition if the app source is published under AGPL-compatible terms.

## Current State

- Current timing engine: Astronomy Engine
- Current public-release path: possible with MIT notice for Astronomy Engine
- Swiss Ephemeris: not installed yet
- Swiss adapter entrypoint: `getTimingEngine({ engineMode: 'swiss' })`
- strict mode does not fall back to Astronomy Engine
- accepted Swiss runtimes:
  - Node native binding: `swisseph`
  - Swiss Ephemeris command line tool: `swetest`
- Swiss readiness check: `node scripts/check_swiss_ephemeris_readiness.mjs`
- Strict reference clone check: `node scripts/check_established_timing_reference_gate.mjs --strict`

## When Swiss Ephemeris Free Edition Is Added

Required actions:

- install or vendor a Swiss Ephemeris-compatible runtime: `swisseph` or `swetest`
- set `SWETEST_PATH` if the `swetest` binary is not on PATH
- set `SWISS_EPHEMERIS_PATH` if ephemeris data files live outside `vendor/swiss-ephemeris/ephe`
- run `npm run check:swiss`
- run `npm run check:timing:strict`
- publish the complete corresponding app source code
- include AGPL license text or an AGPL license link
- include Swiss Ephemeris copyright notices
- show a clear source-code link in the app
- keep private data and secret keys outside the repository
- rerun the strict reference clone Gate

## Runtime Boundary

The current static browser page uses Astronomy Engine compatibility mode.

The common Node `swisseph` package is a native binding, so Swiss Ephemeris should be used from a server/runtime layer unless a browser-safe WASM build is intentionally adopted and licensed. The calculation module is already prepared for this split:

- `engineMode: 'astronomy'`: current static-browser-compatible mode
- `engineMode: 'auto'`: use Swiss if available, otherwise Astronomy
- `engineMode: 'swiss'`: require a Swiss-compatible runtime and throw if unavailable
- `engineMode: 'swisseph'`: require the Node native binding
- `engineMode: 'swetest'`: require the `swetest` command line tool

## Important Boundary

Source code can be public. User data must not be public.

Do not commit:

- real user birth data
- saved chart IDs
- API keys
- database credentials
- private logs

## Commercial Use

Charging for access is not automatically forbidden by AGPL. The key condition is that users must be able to access the corresponding source code under the license terms.

If the app ever needs closed-source distribution, use the Swiss Ephemeris Professional License instead.
