import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  BODIES,
  calculateEstablishedTiming,
  getTimingEngine,
  normDeg
} from './established_timing_calculator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');

function angularDiff(a, b) {
  const d = Math.abs(normDeg(a) - normDeg(b));
  return d > 180 ? 360 - d : d;
}

function toleranceForBody(body, standardToleranceDeg) {
  if (globalThis.__ASTRO_STRICT_REFERENCE_GATE__) return standardToleranceDeg;
  // Astronomy Engine's lunar model can differ from the reference site's
  // ephemeris by a few arcminutes on older dates. Keep all other bodies strict.
  return body === 'Moon' ? 0.05 : standardToleranceDeg;
}

async function loadReferenceData() {
  await import(pathToFileURL(path.join(appDir, 'reference-current-data.js')).href);
  return globalThis.AstrologyReferenceCloneData;
}

function loadAdditionalReferenceData() {
  const filePath = path.join(appDir, 'reference-additional-validation-data.json');
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function comparePlanetSet(method, calculatedRows, referenceRows, toleranceDeg, issues) {
  const comparisons = [];
  const bodies = referenceRows.map((row) => row.planet).filter(Boolean);
  for (const body of bodies) {
    const calculated = calculatedRows.find((row) => row.body === body);
    const reference = referenceRows.find((row) => row.planet === body);
    if (!calculated || !reference) {
      issues.push(`${method}: missing row for ${body}`);
      continue;
    }
    const diff = angularDiff(calculated.longitude, reference.longitude);
    const toleranceDegForBody = toleranceForBody(body, toleranceDeg);
    comparisons.push({
      body,
      calculated: calculated.longitude,
      reference: reference.longitude,
      diff_deg: Number(diff.toFixed(6)),
      tolerance_deg: toleranceDegForBody,
      ok: diff <= toleranceDegForBody
    });
    if (diff > toleranceDegForBody) {
      issues.push(`${method}: ${body} differs by ${diff.toFixed(6)} degrees`);
    }
  }
  return comparisons;
}

const SIGN_JA_BY_EN = {
  Aries: '牡羊座',
  Taurus: '牡牛座',
  Gemini: '双子座',
  Cancer: '蟹座',
  Leo: '獅子座',
  Virgo: '乙女座',
  Libra: '天秤座',
  Scorpio: '蠍座',
  Sagittarius: '射手座',
  Capricorn: '山羊座',
  Aquarius: '水瓶座',
  Pisces: '魚座'
};

const LORD_JA_BY_EN = {
  Mars: '火星',
  Venus: '金星',
  Mercury: '水星',
  Moon: '月',
  Sun: '太陽',
  Jupiter: '木星',
  Saturn: '土星'
};

function compareAdditionalPlanetSet(method, calculatedRows, referenceRows, referenceKey, toleranceDeg, issues) {
  const comparisons = [];
  for (const reference of referenceRows) {
    const body = reference.planet;
    const calculated = calculatedRows.find((row) => row.body === body);
    if (!calculated) {
      issues.push(`${method}: missing row for ${body}`);
      continue;
    }
    const diff = angularDiff(calculated.longitude, reference[referenceKey]);
    const toleranceDegForBody = toleranceForBody(body, toleranceDeg);
    comparisons.push({
      body,
      calculated: calculated.longitude,
      reference: reference[referenceKey],
      diff_deg: Number(diff.toFixed(6)),
      tolerance_deg: toleranceDegForBody,
      ok: diff <= toleranceDegForBody
    });
    if (diff > toleranceDegForBody) {
      issues.push(`${method}: ${body} differs by ${diff.toFixed(6)} degrees`);
    }
  }
  return comparisons;
}

function strictSwissUnavailableReport(error) {
  return {
    schema: 'established-timing-reference-gate/v1',
    verdict: 'NG',
    engine: 'Swiss Ephemeris',
    reference_site: 'Astrology Readings Online',
    tolerance_deg_standard: 0.02,
    mode: 'strict_reference_clone',
    tolerance_deg_moon: 0.02,
    precision_note: 'Strict mode requires Swiss Ephemeris. Astronomy Engine compatibility mode is not accepted here.',
    sample_count: 0,
    issues: [`Swiss Ephemeris is required for strict reference clone mode but is not available: ${error.message}`]
  };
}

function compareAdditionalSample(sample, targetDate, toleranceDeg, calculatorOptions) {
  const issues = [];
  const result = calculateEstablishedTiming(sample.input, targetDate, sample.natal_ascendant.longitude, calculatorOptions);
  const comparisons = {
    transits: compareAdditionalPlanetSet(`${sample.label}: transits`, result.transits.planets, sample.planets, 'transit_longitude', toleranceDeg, issues),
    secondary_progressions: compareAdditionalPlanetSet(`${sample.label}: secondary_progressions`, result.secondary_progressions.planets, sample.planets, 'progressed_longitude', toleranceDeg, issues),
    solar_return: compareAdditionalPlanetSet(`${sample.label}: solar_return`, result.solar_return.planets, sample.solar_return.planets, 'longitude', toleranceDeg, issues)
  };

  const prof = result.annual_profection;
  const expectedSignJa = SIGN_JA_BY_EN[sample.annual_profection.sign_en];
  const expectedLordJa = LORD_JA_BY_EN[sample.annual_profection.lord_en];
  if (prof.age !== sample.annual_profection.age) issues.push(`${sample.label}: annual_profection age mismatch`);
  if (prof.activated_house !== sample.annual_profection.house) issues.push(`${sample.label}: annual_profection house mismatch`);
  if (prof.activated_sign !== expectedSignJa) issues.push(`${sample.label}: annual_profection sign mismatch`);
  if (prof.lord_of_year !== expectedLordJa) issues.push(`${sample.label}: annual_profection lord mismatch`);

  return {
    label: sample.label,
    verdict: issues.length ? 'NG' : 'PASS',
    solar_return_time_utc: result.solar_return.return_time_utc,
    secondary_progressed_date_utc: result.secondary_progressions.progressed_date_utc,
    annual_profection: prof,
    comparisons,
    issues
  };
}

export async function runEstablishedTimingReferenceGate() {
  const issues = [];
  const strictMode = globalThis.__ASTRO_STRICT_REFERENCE_GATE__ === true;
  let calculatorOptions = {};
  if (strictMode) {
    try {
      calculatorOptions = { engine: getTimingEngine({ engineMode: 'swiss' }) };
    } catch (error) {
      return strictSwissUnavailableReport(error);
    }
  }
  const reference = await loadReferenceData();
  const additionalReference = loadAdditionalReferenceData();
  if (!reference) {
    return {
      schema: 'established-timing-reference-gate/v1',
      verdict: 'NG',
      issues: ['reference-current-data.js did not load AstrologyReferenceCloneData']
    };
  }

  const input = {
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    timezoneOffset: 9,
    latitude: 34.69,
    longitude: 135.5
  };
  const targetDate = { year: 2026, month: 6, day: 11 };
  const natalAscLongitude = 10; // Aries rising in the reference sample; sign is enough for profection.
  const result = calculateEstablishedTiming(input, targetDate, natalAscLongitude, calculatorOptions);

  const comparisons = {
    transits: comparePlanetSet('transits', result.transits.planets, reference.transits.planets, 0.02, issues),
    secondary_progressions: comparePlanetSet('secondary_progressions', result.secondary_progressions.planets, reference.secondary_progressions.planets, 0.02, issues),
    solar_return: comparePlanetSet('solar_return', result.solar_return.planets, reference.solar_return.planets, 0.02, issues)
  };

  const prof = result.annual_profection;
  if (prof.age !== reference.annual_profections.current.age) issues.push('annual_profection: age mismatch');
  if (prof.activated_house !== reference.annual_profections.current.house) issues.push('annual_profection: activated house mismatch');
  if (prof.activated_sign !== reference.annual_profections.current.sign_ja) issues.push('annual_profection: activated sign mismatch');
  if (prof.lord_of_year !== reference.annual_profections.current.lord_ja) issues.push('annual_profection: lord of year mismatch');
  if (!Array.isArray(result.past_present_future_flow) || result.past_present_future_flow.length !== 21) {
    issues.push('past_present_future_flow: expected 21 yearly rows');
  } else {
    const currentRow = result.past_present_future_flow.find((row) => row.phase === 'current');
    if (currentRow?.profection?.activated_house !== prof.activated_house) {
      issues.push('past_present_future_flow: current yearly profection does not match active annual profection');
    }
  }
  if (!Array.isArray(result.ten_year_flow) || result.ten_year_flow.length !== 10) {
    issues.push('ten_year_flow: expected 10 future yearly rows');
  }
  if (!Array.isArray(result.one_year_monthly_flow) || result.one_year_monthly_flow.length !== 12) {
    issues.push('one_year_monthly_flow: expected 12 monthly rows');
  } else {
    const firstMonth = result.one_year_monthly_flow[0];
    if (firstMonth?.active_from !== '2026-06-11') {
      issues.push('one_year_monthly_flow: first month should start from the target date');
    }
    if (!firstMonth?.progressed_moon) {
      issues.push('one_year_monthly_flow: first month is missing progressed Moon');
    }
    if (!Array.isArray(firstMonth?.monthly_transits) || firstMonth.monthly_transits.length !== 10) {
      issues.push('one_year_monthly_flow: first month expected 10 month-start transits');
    }
  }

  if (!additionalReference) {
    issues.push('reference-additional-validation-data.json is missing');
  } else {
    if (additionalReference.schema !== 'astrology-readings-online-additional-reference-values/v1') {
      issues.push('additional reference schema is invalid');
    }
    if (additionalReference.security?.source_code_copied !== false) {
      issues.push('additional reference must not copy source code');
    }
    if (additionalReference.security?.interpretation_text_copied !== false) {
      issues.push('additional reference must not copy interpretation text');
    }
    if (additionalReference.security?.saved_chart_ids_redacted !== true) {
      issues.push('additional reference saved chart ids must be redacted');
    }
  }

  const additionalTargetDate = { year: 2026, month: 6, day: 11 };
  const additionalSamples = (additionalReference?.samples || []).map((sample) => compareAdditionalSample(sample, additionalTargetDate, 0.02, calculatorOptions));
  additionalSamples.forEach((sampleReport) => {
    if (sampleReport.verdict !== 'PASS') {
      issues.push(...sampleReport.issues);
    }
  });

  return {
    schema: 'established-timing-reference-gate/v1',
    verdict: issues.length ? 'NG' : 'PASS',
    engine: result.engine,
    reference_site: reference.source_site,
    tolerance_deg_standard: 0.02,
    mode: strictMode ? 'strict_reference_clone' : 'astronomy_engine_compatibility',
    tolerance_deg_moon: strictMode ? 0.02 : 0.05,
    precision_note: strictMode
      ? 'Strict mode uses a Swiss Ephemeris-compatible runtime and the same 0.02 degree tolerance for every body.'
      : 'Moon uses a wider compatibility tolerance because Astronomy Engine can differ from the reference-site ephemeris by a few arcminutes on older progressed dates.',
    sample_count: 1 + additionalSamples.length,
    solar_return_time_utc: result.solar_return.return_time_utc,
    secondary_progressed_date_utc: result.secondary_progressions.progressed_date_utc,
    annual_profection: prof,
    comparisons,
    additional_samples: additionalSamples,
    issues
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--strict')) {
    globalThis.__ASTRO_STRICT_REFERENCE_GATE__ = true;
  }
  const report = await runEstablishedTimingReferenceGate();
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.verdict === 'PASS' ? 0 : 1);
}
