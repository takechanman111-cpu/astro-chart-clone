# AGPL / Swiss Ephemeris Plan

This project uses Swiss Ephemeris Free Edition through `swetest`; the app source must stay published under AGPL-compatible terms.

## Current State

- Current timing engine: Swiss Ephemeris `swetest`
- Current public-release path: AGPL-compatible public-source operation
- Swiss Ephemeris: vendored for local/runtime use
- Swiss adapter entrypoint: `getTimingEngine({ engineMode: 'swetest' })`
- strict mode and app mode do not fall back to any browser/simple calculation
- accepted Swiss runtimes:
  - Swiss Ephemeris command line tool: `swetest`
- Swiss readiness check: `node scripts/check_swiss_ephemeris_readiness.mjs`
- Strict reference clone check: `node scripts/check_established_timing_reference_gate.mjs --strict`

## Swiss Ephemeris Free Edition Requirements

Required actions:

- install or vendor the Swiss Ephemeris `swetest` runtime
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

The browser page does not calculate astrology positions itself. It calls `/api/timing`, and that API requires `swetest`.

- `engineMode: 'swetest'`: require the `swetest` command line tool
- `engineMode: 'auto'` and `engineMode: 'swiss'`: treated as `swetest`
- browser/simple fallback: not allowed

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
