# Unknown Birth Time Support

Implementation date: 2026-09-10. Local-only change; this document is not evidence of a production deployment.

## Scope and existing boundaries

- Add `input.birthTimeUnknown: true` to the existing `/api/timing` endpoint. Omitted/false retains the known-time result schema and calculation path.
- The unknown-time response schema is `unknown-birth-time/v1`. The input hour, minute and second are null. It does not contain a natal house chart or known-time timing response.
- The first version supports the 46 prefecture entries before Okinawa in the existing form, with the Japan time-zone selection. `prefectureIndex` is required. Okinawa and overseas/other are explicitly unsupported until regional time-zone applicability is verified. Never tell a user to choose a false birthplace to proceed.
- Unknown-time calculation uses the local date in `Asia/Tokyo` from the runtime IANA time-zone data, including historical summer time. It does not force a fixed 24-hour day.
- Approximate time windows, rectification, and unknown-time transit/progression/solar-return calculations are not implemented here. They must not silently use a noon natal chart.
- The public Netlify and WordPress configuration, reduced no-text-output app, authentication, storage policy and Swiss calculation engine remain outside this change.

## Calculation contract

Use only the existing Swiss Ephemeris `swetest` with geocentric tropical longitude and speed. Major ten planets, mean Node, opposite south Node, Chiron and mean Apogee are included. House calculation is never requested in this branch. Swiss output errors, missing fields and incomplete groups fail closed, with no alternate engine.

The local-day interval is half open: start inclusive, following midnight exclusive. The following-midnight position is included only as a conservative numerical bound, not as an observed birth candidate. The central instant is a separately labeled reference point for the house-free wheel.

Positions and speeds are sampled at intervals of at most 150 seconds. Measured midpoints are compared with the endpoint Hermite estimate. Detected sign, one-degree, orb and speed-reversal boundaries are refined to one-second brackets. Same-sign speed triples are checked for a quadratic turning point near zero; unresolved individual or relative turns prevent a common classification. Longitude is unwrapped before ranges are assessed. Aspects use simultaneous planet pairs, not independent longitude extrema.

Numerical tolerances: `1e-4` degrees and `1e-5` degrees/day. Values near a boundary or a failed interpolation check are unresolved. A change actually observed within the day is conditional. This is bounded numerical verification, not a mathematical proof of a continuous interval or evidence for astrology's interpretive validity. The screen and copied data carry this limitation.

Major aspect orbs are inherited: conjunction/opposition/trine/square 8 degrees, sextile 6 degrees. Element, modality and polarity counts use ten equal-weight planets only, at simultaneous sample times including refined event brackets. If signs vary, counts are explicitly sample ranges, not a guaranteed joint probability distribution. Dispositor chains are emitted only when all ten signs are common. Sabian numbers use the unrounded degree floor plus one, and are adopted only for a common degree bin.

## User-state rules

- Checking unknown time disables the time controls without overwriting their selected values.
- Any input change clears both result modes, copied text and the previous timing data.
- During calculation the input controls are disabled to prevent stale requests from replacing a newer form state.
- Failure leaves only the error and retained input, never an old result. Copy is disabled/removed until a new successful result.
- Data are calculated in memory. This feature adds no persistent storage, analytics, external account calls or birth-data logs.

## Local verification procedure

Prerequisites: Node ESM runtime, executable Swiss swetest and required ephemeris files from the existing setup. Use the existing README_DEPLOY setup only if these are missing. Never reauthenticate or deploy for this feature's local tests.

1. Inspect the current worktree and snapshot the target files before editing. Preserve unrelated and untracked files.
2. Run `npm run check:deploy` with logs directed outside the app's public static directory. This command checks source safety, existing API/reference contracts and unknown-time tests; it does not deploy.
3. Start the existing server on an unused loopback port, e.g. `PORT=4186 npm start`.
4. In the exact user-authorized local test tab, test unknown time with a Moon ingress day, stable Moon sign, Sun ingress, historical summer-time date and leap day. Use fictional fixtures only.
5. Test known/unknown switching, invalid date, unsupported location, copying and input invalidation. Check desktop and 390px mobile layout, house-free diagram and table scrolling.
6. Obtain the independent user and source reviews on the current hashes and run the existing diagnosis-app post gate. Automated test success alone is not visual or user acceptance evidence.
7. Reset the test viewport. Do not publish until separately authorized and the existing publication runbook passes.

Current test/evidence directory outside the public app: `shared/削除予定/中間生成物_出生時間不明アプリ対応_20260910/` in the parent workspace. Review JSON records identify the exact reviewed hashes. Do not reuse a review for later changed files.

## Recovery

Stop only this loopback server. Revert only the feature-owned diff after checking for subsequent user changes, or recover the named files from the run's `backup/HEAD.tar`. Do not reset the repository, remove untracked WordPress files, change production configuration, or switch calculation engines. Incomplete numerical verification must remain unresolved/error, not be relabeled confirmed.
