import { calculateTimingPayload, sanitizeTimingPayload } from './timing_server.mjs';

const samplePayload = {
  input: {
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    timezoneOffset: 9,
    latitude: 34.69,
    longitude: 135.5
  },
  targetDate: { year: 2026, month: 6, day: 11 },
  engineMode: 'swetest'
};

const issues = [];

function checkedDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

try {
  const sanitized = sanitizeTimingPayload(samplePayload);
  if (sanitized.input.year !== 1990) issues.push('sanitized input year mismatch');
  if (sanitized.targetDate.year !== 2026) issues.push('sanitized target year mismatch');
  if (sanitized.engineMode !== 'swetest') issues.push('engine mode was not forced to swetest');
} catch (error) {
  issues.push(`valid payload was rejected: ${error.message}`);
}

try {
  sanitizeTimingPayload({ ...samplePayload, input: { ...samplePayload.input, latitude: 999 } });
  issues.push('invalid latitude was accepted');
} catch {
  // expected
}

try {
  const result = calculateTimingPayload(samplePayload, { engineMode: 'swetest' });
  if (result.schema !== 'established-astrology-timing/v1') issues.push('result schema mismatch');
  if (result.engine_id !== 'swetest_cli') issues.push('result did not use Swiss Ephemeris swetest');
  if (result.calculation_policy !== 'swiss_ephemeris_swetest_only') issues.push('calculation policy is not swetest-only');
  if (result.natal_chart?.schema !== 'swiss-natal-chart/v1') issues.push('result is missing Swiss natal chart payload');
  if (result.natal_chart?.engine_id !== 'swetest_cli') issues.push('natal chart did not use Swiss Ephemeris swetest');
  if (!Array.isArray(result.natal_chart?.planets) || result.natal_chart.planets.length !== 10) issues.push('natal chart did not return 10 planets');
  if (!Array.isArray(result.natal_chart?.houses) || result.natal_chart.houses.length !== 12) issues.push('natal chart did not return 12 house cusps');
  if (!Array.isArray(result.natal_chart?.points) || result.natal_chart.points.length !== 4) issues.push('natal chart did not return 4 sensitive points');
  if (result.transits.planets.length !== 10) issues.push('transits did not return 10 planets');
  if (result.secondary_progressions.planets.length !== 10) issues.push('secondary progressions did not return 10 planets');
  if (result.solar_return.planets.length !== 10) issues.push('solar return did not return 10 planets');
  if (result.annual_profection.activated_house !== 1) issues.push('annual profection sample house mismatch');
  if (!Array.isArray(result.past_present_future_flow) || result.past_present_future_flow.length !== 21) {
    issues.push('past-present-future flow did not return 21 yearly rows');
  } else {
    const pastRows = result.past_present_future_flow.filter((row) => row.phase === 'past');
    const currentRows = result.past_present_future_flow.filter((row) => row.phase === 'current');
    const futureRows = result.past_present_future_flow.filter((row) => row.phase === 'future');
    if (pastRows.length !== 10) issues.push('past-present-future flow did not return 10 past rows');
    if (currentRows.length !== 1) issues.push('past-present-future flow did not return 1 current row');
    if (futureRows.length !== 10) issues.push('past-present-future flow did not return 10 future rows');
    const currentYear = currentRows[0];
    if (currentYear?.profection?.activated_house !== result.annual_profection.activated_house) {
      issues.push('past-present-future current profection does not match current annual profection');
    }
    if (!currentYear?.progressed_sun || !currentYear?.progressed_moon) {
      issues.push('past-present-future current row is missing progressed Sun or Moon');
    }
    if (!Array.isArray(currentYear?.long_term_transits) || currentYear.long_term_transits.length !== 5) {
      issues.push('past-present-future current row did not return Jupiter-Pluto transits');
    }
  }
  if (!Array.isArray(result.ten_year_flow) || result.ten_year_flow.length !== 10) {
    issues.push('compat ten year flow did not return 10 future rows');
  }
  if (!Array.isArray(result.one_year_monthly_flow) || result.one_year_monthly_flow.length !== 12) {
    issues.push('one year monthly flow did not return 12 monthly rows');
  } else {
    const firstMonth = result.one_year_monthly_flow[0];
    if (firstMonth?.active_from !== '2026-06-11') {
      issues.push('one year monthly flow first month does not start from the target date');
    }
    if (!firstMonth?.progressed_sun || !firstMonth?.progressed_moon) {
      issues.push('one year monthly flow first month is missing progressed Sun or Moon');
    }
    if (!Array.isArray(firstMonth?.monthly_transits) || firstMonth.monthly_transits.length !== 10) {
      issues.push('one year monthly flow first month did not return 10 month-start transits');
    }
  }
} catch (error) {
  issues.push(`valid timing payload calculation failed: ${error.message}`);
}

const report = {
  schema: 'timing-api-contract-gate/v1',
  verdict: issues.length ? 'NG' : 'PASS',
  checked_on: checkedDate(),
  endpoint: '/api/timing',
  issues
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.verdict === 'PASS' ? 0 : 1);
