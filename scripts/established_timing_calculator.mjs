import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

export const SIGNS = [
  { en3: 'Ari', ja: '牡羊座', base: 0 },
  { en3: 'Tau', ja: '牡牛座', base: 30 },
  { en3: 'Gem', ja: '双子座', base: 60 },
  { en3: 'Can', ja: '蟹座', base: 90 },
  { en3: 'Leo', ja: '獅子座', base: 120 },
  { en3: 'Vir', ja: '乙女座', base: 150 },
  { en3: 'Lib', ja: '天秤座', base: 180 },
  { en3: 'Sco', ja: '蠍座', base: 210 },
  { en3: 'Sag', ja: '射手座', base: 240 },
  { en3: 'Cap', ja: '山羊座', base: 270 },
  { en3: 'Aqu', ja: '水瓶座', base: 300 },
  { en3: 'Pis', ja: '魚座', base: 330 }
];

export const BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

export const BODY_JA = {
  Sun: '太陽',
  Moon: '月',
  Mercury: '水星',
  Venus: '金星',
  Mars: '火星',
  Jupiter: '木星',
  Saturn: '土星',
  Uranus: '天王星',
  Neptune: '海王星',
  Pluto: '冥王星'
};

export const TRADITIONAL_RULER = ['火星', '金星', '水星', '月', '太陽', '水星', '金星', '火星', '木星', '土星', '土星', '木星'];

const OUTER_BODIES = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const PROGRESSED_YEAR_MARKERS = ['Sun', 'Moon'];
const MONTHLY_TRANSIT_BODIES = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const MAJOR_TRANSIT_ASPECTS = [
  { key: 'conjunction', ja: 'コンジャンクション', symbol: '☌', angle: 0, orb: 2 },
  { key: 'opposition', ja: 'オポジション', symbol: '☍', angle: 180, orb: 2 },
  { key: 'trine', ja: 'トライン', symbol: '△', angle: 120, orb: 2 },
  { key: 'square', ja: 'スクエア', symbol: '□', angle: 90, orb: 2 },
  { key: 'sextile', ja: 'セクスタイル', symbol: '＊', angle: 60, orb: 1.5 }
];

const SWISS_BODY_FALLBACK_IDS = {
  Sun: 0,
  Moon: 1,
  Mercury: 2,
  Venus: 3,
  Mars: 4,
  Jupiter: 5,
  Saturn: 6,
  Uranus: 7,
  Neptune: 8,
  Pluto: 9
};

const SWETEST_NATAL_SEQUENCE = '0123456789mDA';
export function normDeg(value) {
  return ((value % 360) + 360) % 360;
}

function signedAngularDiff(current, target) {
  return ((normDeg(current) - normDeg(target) + 540) % 360) - 180;
}

function dateToSwissUtParts(date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours()
      + date.getUTCMinutes() / 60
      + date.getUTCSeconds() / 3600
      + date.getUTCMilliseconds() / 3600000
  };
}

function findSwissEphemerisPath() {
  const candidates = [
    process.env.SWISS_EPHEMERIS_PATH,
    path.join(appDir, 'vendor/swiss-ephemeris/ephe'),
    path.join(appDir, 'vendor/swiss-ephemeris')
  ].filter(Boolean);
  return candidates.find((candidate) => {
    try {
      return candidate && fs.existsSync(candidate);
    } catch {
      return false;
    }
  }) || null;
}

function isExecutableFile(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export function findSwetestBinary() {
  if (process.env.SWETEST_PATH && isExecutableFile(process.env.SWETEST_PATH)) {
    return process.env.SWETEST_PATH;
  }
  const pathEntries = String(process.env.PATH || '').split(path.delimiter).filter(Boolean);
  for (const dir of pathEntries) {
    const candidate = path.join(dir, 'swetest');
    if (isExecutableFile(candidate)) return candidate;
  }
  const commonCandidates = [
    '/opt/homebrew/bin/swetest',
    '/usr/local/bin/swetest',
    path.join(appDir, 'vendor/swiss-ephemeris/swetest'),
    path.join(appDir, 'vendor/swiss-ephemeris/bin/swetest')
  ];
  return commonCandidates.find(isExecutableFile) || null;
}

function formatUtcTimeForSwetest(date) {
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const secondNumber = date.getUTCSeconds() + date.getUTCMilliseconds() / 1000;
  const second = secondNumber % 1 === 0
    ? String(secondNumber).padStart(2, '0')
    : secondNumber.toFixed(3).padStart(6, '0');
  return `${hour}:${minute}:${second}`;
}

function parseSwetestLongitude(output) {
  const lines = String(output).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const dataLine = lines.find((line) => !/^warning[:\s]/i.test(line) && !/^error[:\s]/i.test(line));
  if (!dataLine) throw new Error(`swetest returned no data line: ${String(output).slice(0, 200)}`);
  const commaColumns = dataLine.split(',').map((column) => column.trim()).filter(Boolean);
  if (commaColumns.length >= 2 && /^-?\d+(?:\.\d+)?$/.test(commaColumns[1])) {
    return Number(commaColumns[1]);
  }
  const numericMatches = dataLine.match(/-?\d+(?:\.\d+)?/g) || [];
  if (!numericMatches.length) throw new Error(`swetest output does not contain a numeric longitude: ${dataLine}`);
  return Number(numericMatches[numericMatches.length - 1]);
}

function parseSwetestRows(output) {
  return String(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^warning[:\s]/i.test(line) && !/^error[:\s]/i.test(line))
    .map((line) => {
      const columns = line.split(',').map((column) => column.trim());
      const longitude = Number(columns[1]);
      if (!Number.isFinite(longitude)) return null;
      const speed = Number(columns[2]);
      return {
        label: columns[0],
        longitude: normDeg(longitude),
        speed_longitude: Number.isFinite(speed) ? speed : null,
        raw: line
      };
    })
    .filter(Boolean);
}

function swetestRows(date, options = {}) {
  const binary = findSwetestBinary();
  if (!binary) throw new Error('Swiss Ephemeris swetest is required but swetest command is not available');
  const ephePath = findSwissEphemerisPath();
  const args = [
    `-b${date.getUTCDate()}.${date.getUTCMonth() + 1}.${date.getUTCFullYear()}`,
    `-ut${formatUtcTimeForSwetest(date)}`,
    '-fPls',
    '-g,',
    '-head',
    '-eswe'
  ];
  if (options.planetSequence) args.splice(2, 0, `-p${options.planetSequence}`);
  if (options.house) {
    args.splice(options.planetSequence ? 3 : 2, 0, `-house${options.house.longitude},${options.house.latitude},${options.house.system || 'E'}`);
  }
  if (ephePath) args.push(`-edir${ephePath}`);
  const output = execFileSync(binary, args, {
    encoding: 'utf8',
    timeout: 15000,
    maxBuffer: 256 * 1024
  });
  return {
    binary,
    ephemeris_path: ephePath,
    rows: parseSwetestRows(output)
  };
}

function requireSwetestRow(rows, label) {
  const row = rows.find((entry) => entry.label === label);
  if (!row) throw new Error(`swetest did not return required row: ${label}`);
  return row;
}

function rowByRegex(rows, pattern, label) {
  const row = rows.find((entry) => pattern.test(entry.label));
  if (!row) throw new Error(`swetest did not return required row: ${label}`);
  return row;
}

function houseNumberFromCusps(longitude, houses) {
  const value = normDeg(longitude);
  const cusps = houses.map((house) => normDeg(house.longitude));
  for (let index = 0; index < 12; index += 1) {
    const current = cusps[index];
    const next = cusps[(index + 1) % 12];
    const local = normDeg(value - current);
    const width = normDeg(next - current);
    if (local < width) return index + 1;
  }
  return 1;
}

function swetestPosition(row) {
  return {
    ...longitudeParts(row.longitude),
    speed_longitude: row.speed_longitude,
    retrograde: row.speed_longitude != null ? row.speed_longitude < 0 : false
  };
}

function genericSearchSunLongitude(engine, targetLongitude, searchStart, days) {
  const startMs = searchStart.getTime();
  const endMs = startMs + days * 86400000;
  const coarseStepMs = 6 * 3600000;
  let bestMs = startMs;
  let bestAbsDiff = Infinity;

  for (let ms = startMs; ms <= endMs; ms += coarseStepMs) {
    const diff = Math.abs(signedAngularDiff(engine.eclipticLongitude('Sun', new Date(ms)), targetLongitude));
    if (diff < bestAbsDiff) {
      bestAbsDiff = diff;
      bestMs = ms;
    }
  }

  let lo = Math.max(startMs, bestMs - coarseStepMs);
  let hi = Math.min(endMs, bestMs + coarseStepMs);
  for (let i = 0; i < 80; i += 1) {
    const left = lo + (hi - lo) / 3;
    const right = hi - (hi - lo) / 3;
    const leftDiff = Math.abs(signedAngularDiff(engine.eclipticLongitude('Sun', new Date(left)), targetLongitude));
    const rightDiff = Math.abs(signedAngularDiff(engine.eclipticLongitude('Sun', new Date(right)), targetLongitude));
    if (leftDiff < rightDiff) hi = right;
    else lo = left;
  }

  return { date: new Date((lo + hi) / 2) };
}

export function createSwetestEphemerisEngine() {
  const binary = findSwetestBinary();
  if (!binary) throw new Error('swetest command is not available');
  const ephePath = findSwissEphemerisPath();
  const bodyIds = { ...SWISS_BODY_FALLBACK_IDS };

  const engine = {
    id: 'swetest_cli',
    label: 'Swiss Ephemeris swetest',
    source: binary,
    ephemeris_path: ephePath,
    eclipticLongitude(body, date) {
      const bodyId = bodyIds[body];
      if (bodyId == null) throw new Error(`swetest body id is not mapped for ${body}`);
      const args = [
        `-b${date.getUTCDate()}.${date.getUTCMonth() + 1}.${date.getUTCFullYear()}`,
        `-ut${formatUtcTimeForSwetest(date)}`,
        `-p${bodyId}`,
        '-fPl',
        '-g,',
        '-head',
        '-eswe'
      ];
      if (ephePath) args.push(`-edir${ephePath}`);
      const output = execFileSync(binary, args, {
        encoding: 'utf8',
        timeout: 10000,
        maxBuffer: 64 * 1024
      });
      return normDeg(parseSwetestLongitude(output));
    }
  };
  engine.searchSunLongitude = (targetLongitude, searchStart, days) => genericSearchSunLongitude(engine, targetLongitude, searchStart, days);
  return engine;
}

export function getTimingEngine(options = {}) {
  const mode = options.engineMode || process.env.ASTRO_TIMING_ENGINE || 'swetest';
  if (mode === 'swetest' || mode === 'swetest_cli') return createSwetestEphemerisEngine();
  if (mode === 'swiss' || mode === 'swiss_ephemeris') return createSwetestEphemerisEngine();
  if (mode === 'auto') return createSwetestEphemerisEngine();
  throw new Error(`Swiss Ephemeris swetest is the only supported timing engine; got ${mode}`);
}

export function dateFromLocal(input) {
  return new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour - input.timezoneOffset, input.minute || 0, input.second || 0));
}

export function dateFromYmdUtc(date) {
  return new Date(Date.UTC(date.year, date.month - 1, date.day, date.hour || 0, date.minute || 0, date.second || 0));
}

export function eclipticLongitude(body, date, engine = getTimingEngine({ engineMode: 'swetest' })) {
  return engine.eclipticLongitude(body, date);
}

export function longitudeParts(longitude) {
  const normalized = normDeg(longitude);
  const signIndex = Math.floor(normalized / 30);
  const within = normalized - signIndex * 30;
  const degree = Math.floor(within);
  const minuteFloat = (within - degree) * 60;
  const minute = Math.floor(minuteFloat);
  const second = Math.floor((minuteFloat - minute) * 60 + 0.5);
  const carryMinute = second >= 60 ? minute + 1 : minute;
  const finalSecond = second >= 60 ? 0 : second;
  const carryDegree = carryMinute >= 60 ? degree + 1 : degree;
  const finalMinute = carryMinute >= 60 ? 0 : carryMinute;
  const finalSignIndex = carryDegree >= 30 ? (signIndex + 1) % 12 : signIndex;
  const finalDegree = carryDegree >= 30 ? 0 : carryDegree;
  return {
    longitude: Number(normalized.toFixed(6)),
    sign_index: finalSignIndex,
    sign_en3: SIGNS[finalSignIndex].en3,
    sign_ja: SIGNS[finalSignIndex].ja,
    degree: finalDegree,
    minute: finalMinute,
    second: finalSecond
  };
}

export function planetRows(date, bodies = BODIES, engine = getTimingEngine({ engineMode: 'swetest' })) {
  return bodies.map((body) => ({
    body,
    body_ja: BODY_JA[body],
    ...longitudeParts(eclipticLongitude(body, date, engine))
  }));
}

export function calculateSwissNatalChart(input) {
  const birthDate = dateFromLocal(input);
  const result = swetestRows(birthDate, {
    planetSequence: SWETEST_NATAL_SEQUENCE,
    house: {
      longitude: input.longitude,
      latitude: input.latitude,
      system: 'E'
    }
  });
  const { rows } = result;
  const houses = Array.from({ length: 12 }, (_, index) => {
    const houseNumber = index + 1;
    const row = rowByRegex(rows, new RegExp(`^house\\s+${houseNumber}\\b`), `house ${houseNumber}`);
    return {
      house: houseNumber,
      ...longitudeParts(row.longitude)
    };
  });
  const ascRow = requireSwetestRow(rows, 'Ascendant');
  const mcRow = requireSwetestRow(rows, 'MC');
  const planets = BODIES.map((body) => {
    const row = requireSwetestRow(rows, body);
    const position = swetestPosition(row);
    return {
      body,
      body_ja: BODY_JA[body],
      ...position,
      house: houseNumberFromCusps(position.longitude, houses)
    };
  });
  const northNodeRow = requireSwetestRow(rows, 'mean Node');
  const northNode = swetestPosition(northNodeRow);
  const southNodePosition = {
    ...longitudeParts(northNode.longitude + 180),
    speed_longitude: northNode.speed_longitude,
    retrograde: northNode.retrograde
  };
  const chironPosition = swetestPosition(requireSwetestRow(rows, 'Chiron'));
  const lilithPosition = swetestPosition(requireSwetestRow(rows, 'mean Apogee'));
  const pointRows = [
    { point: 'north_node', point_ja: 'ノースノード', ...northNode },
    { point: 'south_node', point_ja: 'サウスノード', ...southNodePosition },
    { point: 'chiron', point_ja: 'キロン', ...chironPosition },
    { point: 'mean_lilith', point_ja: 'リリス', ...lilithPosition }
  ].map((point) => ({
    ...point,
    house: houseNumberFromCusps(point.longitude, houses)
  }));

  return {
    schema: 'swiss-natal-chart/v1',
    engine: 'Swiss Ephemeris swetest',
    engine_id: 'swetest_cli',
    engine_source: result.binary,
    ephemeris_path: result.ephemeris_path,
    input,
    birth_date_utc: birthDate.toISOString(),
    zodiac: 'tropical',
    house_system: 'E',
    planets,
    points: pointRows,
    angles: {
      ascendant: {
        name: 'ASC',
        ...longitudeParts(ascRow.longitude)
      },
      mc: {
        name: 'MC',
        ...longitudeParts(mcRow.longitude)
      }
    },
    houses
  };
}

function ymd(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function anniversaryDate(input, ageOffset) {
  const year = input.year + ageOffset;
  const day = Math.min(input.day, daysInMonth(year, input.month));
  return { year, month: input.month, day };
}

function addMonthsToYmd(date, monthOffset) {
  const monthIndex = date.year * 12 + (date.month - 1) + monthOffset;
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex - year * 12 + 1;
  const day = Math.min(date.day, daysInMonth(year, month));
  return { year, month, day };
}

function compareYmd(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

function pickPlanet(rows, body) {
  return rows.find((row) => row.body === body) || null;
}

function angularSeparation(a, b) {
  return Math.abs(((normDeg(a) - normDeg(b) + 540) % 360) - 180);
}

export function majorTransitAspects(transitRows, natalRows, maxResults = 8) {
  const hits = [];
  for (const transit of transitRows) {
    for (const natal of natalRows) {
      const separation = angularSeparation(transit.longitude, natal.longitude);
      for (const aspect of MAJOR_TRANSIT_ASPECTS) {
        const orb = Math.abs(separation - aspect.angle);
        if (orb <= aspect.orb) {
          hits.push({
            transit_body: transit.body,
            transit_body_ja: transit.body_ja,
            natal_body: natal.body,
            natal_body_ja: natal.body_ja,
            aspect: aspect.key,
            aspect_ja: aspect.ja,
            symbol: aspect.symbol,
            orb: Number(orb.toFixed(2)),
            transit_longitude: transit.longitude,
            natal_longitude: natal.longitude
          });
        }
      }
    }
  }
  return hits
    .sort((a, b) => a.orb - b.orb || OUTER_BODIES.indexOf(a.transit_body) - OUTER_BODIES.indexOf(b.transit_body))
    .slice(0, maxResults);
}

export function ageAtDate(input, date) {
  let age = date.year - input.year;
  if (date.month < input.month || (date.month === input.month && date.day < input.day)) age -= 1;
  return age;
}

export function progressedAgeYears(input, targetDate) {
  const age = ageAtDate(input, targetDate);
  const localTargetAtBirthTime = Date.UTC(
    targetDate.year,
    targetDate.month - 1,
    targetDate.day,
    input.hour - input.timezoneOffset,
    input.minute || 0,
    input.second || 0
  );
  const previousBirthday = Date.UTC(
    input.year + age,
    input.month - 1,
    input.day,
    input.hour - input.timezoneOffset,
    input.minute || 0,
    input.second || 0
  );
  const nextBirthday = Date.UTC(
    input.year + age + 1,
    input.month - 1,
    input.day,
    input.hour - input.timezoneOffset,
    input.minute || 0,
    input.second || 0
  );
  return age + (localTargetAtBirthTime - previousBirthday) / (nextBirthday - previousBirthday);
}

export function annualProfection(input, targetDate, ascLongitude) {
  const age = ageAtDate(input, targetDate);
  const activatedHouse = ((age % 12) + 12) % 12 + 1;
  const ascSignIndex = longitudeParts(ascLongitude).sign_index;
  const activatedSignIndex = (ascSignIndex + activatedHouse - 1) % 12;
  return {
    method: 'annual_profection',
    age,
    activated_house: activatedHouse,
    activated_sign: SIGNS[activatedSignIndex].ja,
    lord_of_year: TRADITIONAL_RULER[activatedSignIndex],
    active_from: `${input.year + age}-${String(input.month).padStart(2, '0')}-${String(input.day).padStart(2, '0')}`,
    active_to: `${input.year + age + 1}-${String(input.month).padStart(2, '0')}-${String(input.day).padStart(2, '0')}`
  };
}

export function monthlyProfection(input, targetDate, ascLongitude, monthIndex) {
  const annual = annualProfection(input, targetDate, ascLongitude);
  const monthNumber = Math.max(1, Math.min(12, Number(monthIndex) || activeMonthlyProfectionIndex(input, targetDate)));
  const activatedHouse = ((annual.activated_house + monthNumber - 2) % 12) + 1;
  const ascSignIndex = longitudeParts(ascLongitude).sign_index;
  const activatedSignIndex = (ascSignIndex + activatedHouse - 1) % 12;
  return {
    method: 'monthly_profection',
    month_index: monthNumber,
    annual_age: annual.age,
    activated_house: activatedHouse,
    activated_sign: SIGNS[activatedSignIndex].ja,
    lord_of_month: TRADITIONAL_RULER[activatedSignIndex],
    annual_profection: {
      activated_house: annual.activated_house,
      activated_sign: annual.activated_sign,
      lord_of_year: annual.lord_of_year
    }
  };
}

function activeMonthlyProfectionIndex(input, targetDate) {
  const age = ageAtDate(input, targetDate);
  const annualStart = anniversaryDate(input, age);

  for (let monthOffset = 0; monthOffset < 12; monthOffset += 1) {
    const start = addMonthsToYmd(annualStart, monthOffset);
    const end = addMonthsToYmd(annualStart, monthOffset + 1);
    if (compareYmd(targetDate, start) >= 0 && compareYmd(targetDate, end) < 0) {
      return monthOffset + 1;
    }
  }

  return 12;
}

export function secondaryProgressions(input, targetDate, engine = getTimingEngine({ engineMode: 'swetest' }), bodies = BODIES) {
  const birthDate = dateFromLocal(input);
  const ageYears = progressedAgeYears(input, targetDate);
  const progressedDate = new Date(birthDate.getTime() + ageYears * 86400000);
  return {
    method: 'secondary_progression',
    rule: 'one day after birth equals one year of life; target date is evaluated at the native birth time and interpolated between birthdays',
    progressed_date_utc: progressedDate.toISOString(),
    age_years: Number(ageYears.toFixed(9)),
    planets: planetRows(progressedDate, bodies, engine)
  };
}

export function transits(targetDate, engine = getTimingEngine({ engineMode: 'swetest' }), bodies = BODIES) {
  const target = dateFromYmdUtc(targetDate);
  return {
    method: 'transits',
    target_date_utc: target.toISOString(),
    planets: planetRows(target, bodies, engine)
  };
}

export function solarReturn(input, returnYear, engine = getTimingEngine({ engineMode: 'swetest' })) {
  const birthDate = dateFromLocal(input);
  const natalSunLongitude = eclipticLongitude('Sun', birthDate, engine);
  const searchStart = new Date(Date.UTC(returnYear, input.month - 1, input.day - 10, 0, 0, 0));
  const event = engine.searchSunLongitude(natalSunLongitude, searchStart, 25);
  return {
    method: 'solar_return',
    return_year: returnYear,
    natal_sun_longitude: Number(normDeg(natalSunLongitude).toFixed(6)),
    return_time_utc: event.date.toISOString(),
    planets: planetRows(event.date, BODIES, engine)
  };
}

function yearlyTimingRow(input, ascLongitude, engine, natalRows, currentAge, offsetFromCurrent) {
  const age = currentAge + offsetFromCurrent;
  const periodStart = anniversaryDate(input, age);
  const periodEnd = anniversaryDate(input, age + 1);
  const profection = annualProfection(input, periodStart, ascLongitude);
  const progressions = secondaryProgressions(input, periodStart, engine, PROGRESSED_YEAR_MARKERS);
  const longTermTransits = transits(periodStart, engine, OUTER_BODIES);

  return {
    method: 'past_present_future_flow_year',
    phase: offsetFromCurrent < 0 ? 'past' : offsetFromCurrent > 0 ? 'future' : 'current',
    offset_from_current: offsetFromCurrent,
    age,
    period: `${ymd(periodStart.year, periodStart.month, periodStart.day)}〜${ymd(periodEnd.year, periodEnd.month, periodEnd.day)}`,
    active_from: ymd(periodStart.year, periodStart.month, periodStart.day),
    active_to: ymd(periodEnd.year, periodEnd.month, periodEnd.day),
    profection,
    secondary_progressions: progressions,
    progressed_sun: pickPlanet(progressions.planets, 'Sun'),
    progressed_moon: pickPlanet(progressions.planets, 'Moon'),
    long_term_transits: longTermTransits.planets,
    notable_transits: majorTransitAspects(longTermTransits.planets, natalRows)
  };
}

export function pastPresentFutureFlow(input, targetDate, ascLongitude, engine = getTimingEngine({ engineMode: 'swetest' }), yearsBack = 10, yearsForward = 10) {
  const startAge = ageAtDate(input, targetDate);
  const natalRows = planetRows(dateFromLocal(input), BODIES, engine);
  const rows = [];

  for (let offset = -yearsBack; offset <= yearsForward; offset += 1) {
    rows.push(yearlyTimingRow(input, ascLongitude, engine, natalRows, startAge, offset));
  }

  const past = rows.filter((row) => row.phase === 'past');
  const current = rows.find((row) => row.phase === 'current') || null;
  const future = rows.filter((row) => row.phase === 'future');
  return {
    method: 'past_present_future_flow',
    rule: 'past ten profection years, the current active profection year, and future ten profection years; yearly snapshots use secondary progressed Sun/Moon and Jupiter-Pluto transits at each birthday period start',
    start_age: startAge,
    years_back: yearsBack,
    years_forward: yearsForward,
    past,
    current,
    future,
    years: rows
  };
}

function monthlyTimingRow(input, ascLongitude, engine, natalRows, periodStart, periodEnd, offsetFromTarget) {
  const profection = monthlyProfection(input, periodStart, ascLongitude);
  const progressions = secondaryProgressions(input, periodStart, engine, PROGRESSED_YEAR_MARKERS);
  const monthTransits = transits(periodStart, engine, BODIES);
  const aspectTransitRows = monthTransits.planets.filter((row) => MONTHLY_TRANSIT_BODIES.includes(row.body));

  return {
    method: 'one_year_monthly_flow_month',
    offset_from_target_month: offsetFromTarget,
    period: `${ymd(periodStart.year, periodStart.month, periodStart.day)}〜${ymd(periodEnd.year, periodEnd.month, periodEnd.day)}`,
    active_from: ymd(periodStart.year, periodStart.month, periodStart.day),
    active_to: ymd(periodEnd.year, periodEnd.month, periodEnd.day),
    monthly_profection: profection,
    secondary_progressions: progressions,
    progressed_sun: pickPlanet(progressions.planets, 'Sun'),
    progressed_moon: pickPlanet(progressions.planets, 'Moon'),
    monthly_transits: monthTransits.planets,
    long_term_transits: monthTransits.planets.filter((row) => OUTER_BODIES.includes(row.body)),
    notable_transits: majorTransitAspects(aspectTransitRows, natalRows, 6)
  };
}

export function futureOneYearMonthlyFlow(input, targetDate, ascLongitude, engine = getTimingEngine({ engineMode: 'swetest' })) {
  const natalRows = planetRows(dateFromLocal(input), BODIES, engine);
  const months = [];

  for (let monthOffset = 0; monthOffset < 12; monthOffset += 1) {
    const periodStart = addMonthsToYmd(targetDate, monthOffset);
    const periodEnd = addMonthsToYmd(targetDate, monthOffset + 1);
    months.push(monthlyTimingRow(input, ascLongitude, engine, natalRows, periodStart, periodEnd, monthOffset));
  }

  return {
    method: 'one_year_monthly_flow',
    rule: 'future twelve monthly periods starting from the target date; each month uses the active monthly profection at period start, secondary progressed Sun/Moon, and period-start transits to natal planets',
    active_from: ymd(targetDate.year, targetDate.month, targetDate.day),
    active_to: months[months.length - 1]?.active_to || ymd(targetDate.year, targetDate.month, targetDate.day),
    target_date: targetDate,
    month_count: months.length,
    months
  };
}

export const oneYearMonthlyFlow = futureOneYearMonthlyFlow;

export function tenYearFlow(input, targetDate, ascLongitude, engine = getTimingEngine({ engineMode: 'swetest' }), years = 10) {
  const flow = pastPresentFutureFlow(input, targetDate, ascLongitude, engine, 0, years);
  return {
    method: 'ten_year_flow',
    rule: 'future ten profection years after the current active year; kept for compatibility with earlier app output',
    start_age: flow.start_age,
    years: flow.future
  };
}

export function calculateEstablishedTiming(input, targetDate, ascLongitude, options = {}) {
  const engine = options.engine || getTimingEngine({ ...options, engineMode: options.engineMode || 'swetest' });
  if (engine.id !== 'swetest_cli') {
    throw new Error(`Swiss Ephemeris swetest is required for unified calculation mode; got ${engine.id}`);
  }
  const centeredFlow = pastPresentFutureFlow(input, targetDate, ascLongitude, engine);
  const monthlyFlow = futureOneYearMonthlyFlow(input, targetDate, ascLongitude, engine);
  return {
    schema: 'established-astrology-timing/v1',
    engine: engine.label,
    engine_id: engine.id,
    engine_source: engine.source,
    ephemeris_path: engine.ephemeris_path || null,
    input,
    target_date: targetDate,
    transits: transits(targetDate, engine),
    secondary_progressions: secondaryProgressions(input, targetDate, engine),
    solar_return: solarReturn(input, targetDate.year, engine),
    annual_profection: annualProfection(input, targetDate, ascLongitude),
    past_present_future_flow: centeredFlow.years,
    past_year_flow: centeredFlow.past,
    current_year_flow: centeredFlow.current,
    future_year_flow: centeredFlow.future,
    one_year_monthly_flow: monthlyFlow.months,
    future_one_year_monthly_flow: monthlyFlow.months,
    ten_year_flow: centeredFlow.future,
    ten_year_flow_meta: {
      method: 'ten_year_flow',
      rule: 'future ten profection years after the current active year; kept for compatibility with earlier app output',
      start_age: centeredFlow.start_age,
      year_count: centeredFlow.future.length
    },
    past_present_future_flow_meta: {
      method: centeredFlow.method,
      rule: centeredFlow.rule,
      start_age: centeredFlow.start_age,
      years_back: centeredFlow.years_back,
      years_forward: centeredFlow.years_forward,
      year_count: centeredFlow.years.length
    },
    one_year_monthly_flow_meta: {
      method: monthlyFlow.method,
      rule: monthlyFlow.rule,
      active_from: monthlyFlow.active_from,
      active_to: monthlyFlow.active_to,
      month_count: monthlyFlow.month_count
    }
  };
}
