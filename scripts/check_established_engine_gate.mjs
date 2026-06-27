import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findSwetestBinary } from './established_timing_calculator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

function exists(relativePath) {
  return fs.existsSync(path.join(appDir, relativePath));
}

function hasAnyEstablishedEngine() {
  return [
    'vendor/swiss-ephemeris',
    'vendor/astronomy-engine/astronomy.cjs',
    'node_modules/swisseph',
    'node_modules/astronomy-engine'
  ].some(exists) || findSwetestBinary() != null;
}

function checkAstronomyEngine(issues) {
  const enginePath = path.join(appDir, 'vendor/astronomy-engine/astronomy.cjs');
  if (!fs.existsSync(enginePath)) return false;
  const source = fs.readFileSync(enginePath, 'utf8');
  if (source.includes('[Truncated]')) {
    issues.push('vendor Astronomy Engine file is truncated and cannot be used');
    return false;
  }
  if (!source.includes('MIT License') || !source.includes('Astronomy library for JavaScript')) {
    issues.push('vendor Astronomy Engine file does not contain expected license/header');
    return false;
  }
  try {
    const Astronomy = require(enginePath);
    const date = new Date(Date.UTC(2026, 5, 11, 0, 0, 0));
    const sun = Astronomy.Ecliptic(Astronomy.GeoVector('Sun', date, true)).elon;
    const moon = Astronomy.EclipticGeoMoon(date).lon;
    if (Math.abs(sun - 80.109941) > 0.01 || Math.abs(moon - 22.5901) > 0.01) {
      issues.push('vendor Astronomy Engine smoke calculation did not match expected 2026-06-11 Sun/Moon longitudes');
      return false;
    }
  } catch (error) {
    issues.push(`vendor Astronomy Engine file is not executable as an engine: ${error.message}`);
    return false;
  }
  return true;
}

export function runEstablishedEngineGate(options = {}) {
  const phase = options.phase || 'production';
  const issues = [];
  const htmlPath = path.join(appDir, 'index.html');
  const restartPath = path.join(appDir, 'CALCULATION_RESTART.md');

  if (!fs.existsSync(htmlPath)) issues.push('index.html is missing');
  if (!fs.existsSync(restartPath)) issues.push('CALCULATION_RESTART.md is missing');

  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
  const restart = fs.existsSync(restartPath) ? fs.readFileSync(restartPath, 'utf8') : '';

  if (!restart.includes('The previous timing-reading implementation is unapproved')) {
    issues.push('restart document does not mark the previous timing implementation unapproved');
  }
  if (!restart.includes('use an established astrology/astronomy calculation engine as the source of truth')) {
    issues.push('restart document does not require an established calculation engine');
  }
  if (html.includes('表示表データを使用')) {
    issues.push('index.html still exposes visible-table sample output as timing result');
  }
  if (html.includes('AstrologyReadingsOnlineClone')) {
    issues.push('index.html still calls the visible-output sample adapter');
  }
  const hasValidAstronomyEngine = checkAstronomyEngine(issues);
  if (phase === 'production' && !hasAnyEstablishedEngine() && !hasValidAstronomyEngine) {
    issues.push('no established calculation engine is installed or vendored');
  }

  return {
    schema: 'established-timing-engine-gate/v1',
    verdict: issues.length ? 'NG' : 'PASS',
    phase,
    checked_files: {
      html: htmlPath,
      restart: restartPath
    },
    accepted_engine_paths: [
      'vendor/swiss-ephemeris',
      'vendor/astronomy-engine/astronomy.cjs',
      'swetest on PATH or SWETEST_PATH',
      'node_modules/swisseph',
      'node_modules/astronomy-engine'
    ],
    issues
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const phaseArg = process.argv.find((arg) => arg.startsWith('--phase='));
  const phase = phaseArg ? phaseArg.split('=')[1] : 'production';
  const report = runEstablishedEngineGate({ phase });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.verdict === 'PASS' ? 0 : 1);
}
