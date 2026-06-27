# Timing Calculation Restart

Created: 2026-06-11

## Status

The previous timing-reading implementation is unapproved.

Do not use these as production timing logic:

- captured visible-output table samples
- `reference-current-data.js` as an engine; it may be used only as redacted validation reference data
- `reference-additional-samples.js`
- `reference-site-adapter.js`
- local lightweight timing approximations in `timing-engine.js`
- any display-only clone that does not reproduce the calculation mechanism

## User Requirement

The user requires cloning an established calculation mechanism, then improving it.

This means:

- do not build timing calculations from scratch
- do not hand-roll simplified planetary formulas
- do not treat reference-site visible tables as the engine
- use an established astrology/astronomy calculation engine as the source of truth
- validate transits, secondary progressions, solar returns, and annual profections against Astrology Readings Online output

## Reference Site Finding

Astrology Readings Online public page inspection:

- input form posts to `/save?is_direct=1`
- visible public JavaScript is mainly UI, saved charts, city search, map, ads, analytics, and page behavior
- the actual timing calculations are not exposed as client-side JavaScript on the calculator page
- the calculation mechanism is therefore server-side or otherwise not available as public frontend code

So the clone must not copy site HTML/JS as calculation logic.

## Correct Restart Path

1. Adopt an existing established calculation engine.
2. Build the four timing methods on top of that engine:
   - transits
   - secondary progressions
   - solar return
   - annual profections
3. Validate against Astrology Readings Online examples.
4. Only then expose results in the app UI.

## Engine Candidates

Primary candidate:

- Swiss Ephemeris / pyswisseph / swisseph-compatible implementation

Fallback candidate:

- Astronomy Engine, if Swiss Ephemeris cannot be installed in the local app runtime

## Current Environment

Checked locally on 2026-06-11:

- `swisseph`: not installed
- `skyfield`: not installed
- `astropy`: not installed
- `flatlib`: not installed
- `kerykeion`: not installed
- no bundled Node astronomy/ephemeris package found

Network fetch/install from the shell was not available in this environment during the restart.

Additional attempt:

- Astronomy Engine raw JS was visible in the in-app browser, but saving it through the browser automation text channel produced a truncated file containing `[Truncated]`; this file is not accepted as a valid engine.
- `pyswisseph` installation was attempted with pip, but failed because package index/network resolution was unavailable.
- `check_established_engine_gate.mjs` rejects truncated or non-executable vendor engine files.

Resolved:

- The Astronomy Engine raw page was re-read in small chunks from the in-app browser and saved without truncation.
- Complete engine path: `vendor/astronomy-engine/astronomy.cjs`
- SHA256: `ef52423af0e61e555e1f5321a0576ffabf55ea5080daf84940d9d1f60394d779`
- License path: `vendor/astronomy-engine/LICENSE`
- `check_established_engine_gate.mjs --phase=production` PASS after executable smoke calculation.

## Reference Validation

Validated on 2026-06-11 against Astrology Readings Online:

- sample 1: 1990-01-01 12:00, Osaka, Japan
- sample 2: 1985-05-17 06:30, Tokyo, Japan
- sample 3: 1972-09-03 21:45, New York, USA

Validated methods:

- transits
- secondary progressions
- solar return
- annual profections

Reference data:

- `reference-current-data.js`
- `reference-additional-validation-data.json`

Gate:

- `scripts/check_established_timing_reference_gate.mjs`
- sample count: 3
- verdict: PASS
- standard tolerance: 0.02 degrees
- Moon compatibility tolerance: 0.05 degrees
- strict mode command: `node scripts/check_established_timing_reference_gate.mjs --strict`
- strict mode verdict before Swiss Ephemeris: NG
- strict mode current blocker: sample 3 secondary progressed Moon differs by 0.040923 degrees

Precision note:

- Astronomy Engine matches the reference site tightly for the Sun, planets, solar return, and profections.
- The Moon can differ from the reference site by a few arcminutes on older progressed dates.
- Strict mode now uses Swiss Ephemeris `swetest` and passes all 3 reference samples at 0.02 degrees.
- Secondary progressions match the reference site when the target date is evaluated at the native birth time and interpolated between birthdays.

## Swiss Ephemeris Readiness

Checked on 2026-06-11:

- `scripts/check_swiss_ephemeris_readiness.mjs`
- current verdict: BLOCKED
- `node_modules/swisseph`: missing
- `vendor/swiss-ephemeris`: missing
- shell npm fetch: blocked by DNS (`ENOTFOUND registry.npmjs.org`)

Updated on 2026-06-12:

- local Swiss source existed but was incomplete in the working tree
- `scripts/setup_swiss_ephemeris.sh` now continues when GitHub update fails and restores missing files from local git archive
- macOS `swetest` builds successfully at `vendor/swiss-ephemeris/swetest`
- `npm run setup:swiss` PASS
- `npm run check:swiss` PASS via `swetest_cli`
- `npm run check:timing:strict` PASS against 3 Astrology Readings Online reference samples

Adapter work completed on 2026-06-11:

- `scripts/established_timing_calculator.mjs` now has a timing engine adapter boundary
- `engineMode: 'astronomy'` uses the current Astronomy Engine compatibility mode
- `engineMode: 'auto'` uses Swiss if available, then falls back to Astronomy
- `engineMode: 'swiss'` requires Swiss and throws if unavailable
- strict reference clone mode now requires Swiss; it does not silently fall back to Astronomy
- `package.json` exposes `npm run check:swiss` and `npm run check:timing:strict`

API bridge completed on 2026-06-11:

- `scripts/timing_server.mjs` serves the app and exposes `POST /api/timing`
- `npm start` runs the local timing server
- `npm run check:api` validates the API calculation contract without storing user data
- `index.html` uses `/api/timing` first when served over HTTP, and falls back to browser Astronomy Engine when opened as a local file

Known implementation constraint:

- the known `swisseph` Node package is a native C/C++ binding, not a static-browser drop-in
- Swiss Ephemeris licensing must be reviewed before bundling in a redistributed or commercial app

When Swiss-compatible runtime becomes available:

1. Run `node scripts/check_swiss_ephemeris_readiness.mjs`.
2. Wire timing longitudes to Swiss Ephemeris.
3. Run `node scripts/check_established_timing_reference_gate.mjs --strict`.
4. Require strict PASS before calling the clone one-to-one compatible.

## Gate Rule

The app must remain production-NG until an established calculation engine is installed or vendored and the four methods are validated against reference-site output.
