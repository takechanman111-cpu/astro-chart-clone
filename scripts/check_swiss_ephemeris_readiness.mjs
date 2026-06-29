import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findSwetestBinary, getTimingEngine } from './established_timing_calculator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');

function exists(relativePath) {
  return fs.existsSync(path.join(appDir, relativePath));
}

function checkedDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

function tryCreateSwissTimingEngine() {
  try {
    const engine = getTimingEngine({ engineMode: 'swetest' });
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
  const swissTimingEngine = tryCreateSwissTimingEngine();
  const strictGateReport = await runStrictGateIfPossible(swissTimingEngine.ok);
  const issues = [];

  if (!findSwetestBinary()) {
    issues.push('Swiss Ephemeris swetest command is not installed or vendored in this app.');
  }
  if (!swissTimingEngine.ok) {
    issues.push(`Swiss Ephemeris swetest timing adapter cannot be created: ${swissTimingEngine.error}`);
  }
  if (strictGateReport && strictGateReport.verdict !== 'PASS') {
    issues.push('Strict reference clone Gate is still NG after Swiss load.');
  }

  const report = {
    schema: 'swiss-ephemeris-readiness-gate/v1',
    verdict: issues.length ? 'BLOCKED' : 'PASS',
    checked_on: checkedDate(),
    purpose: 'Confirm that the app can run the unified Swiss Ephemeris swetest calculation mode.',
    required_for: 'one-to-one clone of Astrology Readings Online lunar/progressed values',
    local_candidates: {
      vendor_swiss_ephemeris: exists('vendor/swiss-ephemeris'),
      vendor_swiss_ephemeris_ephe: exists('vendor/swiss-ephemeris/ephe'),
      swetest_binary: findSwetestBinary()
    },
    swiss_timing_engine: swissTimingEngine,
    strict_gate_verdict: strictGateReport?.verdict || null,
    strict_gate_issues: strictGateReport?.issues || [],
    known_constraints: [
      'The browser page does not calculate positions directly; it calls the timing API.',
      'The swetest command line tool is the required Swiss Ephemeris runtime.',
      'Swiss Ephemeris licensing must be reviewed before bundling in a commercial or redistributed app.'
    ],
    next_action_when_available: [
      'Install or vendor the Swiss Ephemeris swetest command.',
      'Keep the timing calculator on Swiss Ephemeris swetest only.',
      'Run node scripts/check_established_timing_reference_gate.mjs --strict and require PASS.'
    ],
    issues
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.verdict === 'PASS' ? 0 : 2);
}

main();
