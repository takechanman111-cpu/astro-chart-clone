import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findSwetestBinary } from './established_timing_calculator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');

function exists(relativePath) {
  return fs.existsSync(path.join(appDir, relativePath));
}

function hasAnyEstablishedEngine() {
  return exists('vendor/swiss-ephemeris') || findSwetestBinary() != null;
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
  if (phase === 'production' && !hasAnyEstablishedEngine()) {
    issues.push('Swiss Ephemeris swetest is not installed or vendored');
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
      'swetest on PATH or SWETEST_PATH'
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
