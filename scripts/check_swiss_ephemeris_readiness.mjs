import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findSwetestBinary, getTimingEngine } from './established_timing_calculator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

function exists(relativePath) {
  return fs.existsSync(path.join(appDir, relativePath));
}

function checkedDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

function tryRequireSwiss() {
  try {
    const swisseph = require('swisseph');
    return {
      ok: true,
      has_swe_julday: typeof swisseph.swe_julday === 'function',
      has_swe_calc_ut: typeof swisseph.swe_calc_ut === 'function',
      has_swe_set_ephe_path: typeof swisseph.swe_set_ephe_path === 'function'
    };
  } catch (error) {
    return {
      ok: false,
      error: String(error?.message || error)
    };
  }
}

function tryCreateSwissTimingEngine() {
  try {
    const engine = getTimingEngine({ engineMode: 'swiss' });
    return {
      ok: true,
      engine_id: engine.id,
      engine_label: engine.label,
      engine_source: engine.source,
      ephemeris_path: engine.ephemeris_path || null,
      flags: engine.flags || null,
      has_ecliptic_longitude: typeof engine.eclipticLongitude === 'function',
      has_solar_return_search: typeof engine.searchSunLongitude === 'function'
    };
  } catch (error) {
    return {
      ok: false,
      error: String(error?.message || error)
    };
  }
}

async function runStrictGateIfPossible(swissRuntimeReady) {
  if (!swissRuntimeReady) return null;
  const strictGate = await import(pathToFileURL(path.join(appDir, 'scripts/check_established_timing_reference_gate.mjs')).href);
  globalThis.__ASTRO_STRICT_REFERENCE_GATE__ = true;
  return strictGate.runEstablishedTimingReferenceGate();
}

async function main() {
  const swissLoad = tryRequireSwiss();
  const swissTimingEngine = tryCreateSwissTimingEngine();
  const strictGateReport = await runStrictGateIfPossible(swissTimingEngine.ok);
  const issues = [];

  if (!exists('node_modules/swisseph') && !exists('vendor/swiss-ephemeris') && !findSwetestBinary()) {
    issues.push('Swiss Ephemeris package/vendor files are not installed in this app.');
  }
  if (!swissLoad.ok && !swissTimingEngine.ok) {
    issues.push(`Node cannot require swisseph: ${swissLoad.error}`);
  }
  if (swissLoad.ok && (!swissLoad.has_swe_julday || !swissLoad.has_swe_calc_ut)) {
    issues.push('swisseph is present but required calculation APIs are missing.');
  }
  if (!swissTimingEngine.ok) {
    issues.push(`Swiss timing adapter cannot be created: ${swissTimingEngine.error}`);
  }
  if (strictGateReport && strictGateReport.verdict !== 'PASS') {
    issues.push('Strict reference clone Gate is still NG after Swiss load.');
  }

  const report = {
    schema: 'swiss-ephemeris-readiness-gate/v1',
    verdict: issues.length ? 'BLOCKED' : 'PASS',
    checked_on: checkedDate(),
    purpose: 'Detect whether the app can move from Astronomy Engine compatibility mode to Swiss Ephemeris strict reference clone mode.',
    required_for: 'stricter one-to-one clone of Astrology Readings Online lunar/progressed values',
    local_candidates: {
      node_modules_swisseph: exists('node_modules/swisseph'),
      vendor_swiss_ephemeris: exists('vendor/swiss-ephemeris'),
      vendor_swiss_ephemeris_ephe: exists('vendor/swiss-ephemeris/ephe'),
      swetest_binary: findSwetestBinary()
    },
    swiss_load: swissLoad,
    swiss_timing_engine: swissTimingEngine,
    strict_gate_verdict: strictGateReport?.verdict || null,
    strict_gate_issues: strictGateReport?.issues || [],
    known_constraints: [
      'The known Node swisseph package is a native C/C++ binding, not a direct static-browser drop-in.',
      'The swetest command line tool is also accepted as a Swiss Ephemeris-compatible runtime.',
      'Swiss Ephemeris licensing must be reviewed before bundling in a commercial or redistributed app.',
      'Shell network/DNS is unavailable in this environment, so npm cannot fetch swisseph here.'
    ],
    next_action_when_available: [
      'Install or vendor a Swiss Ephemeris-compatible runtime: node swisseph binding or swetest command.',
      'Wire the timing calculator to use Swiss longitudes instead of Astronomy Engine longitudes.',
      'Run node scripts/check_established_timing_reference_gate.mjs --strict and require PASS.'
    ],
    issues
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.verdict === 'PASS' ? 0 : 2);
}

main();
