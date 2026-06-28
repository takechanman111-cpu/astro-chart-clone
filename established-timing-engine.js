(function (global) {
  'use strict';

  const Astronomy = global.Astronomy;

  const SIGNS = [
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

  const BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const BODY_JA = { Sun: '太陽', Moon: '月', Mercury: '水星', Venus: '金星', Mars: '火星', Jupiter: '木星', Saturn: '土星', Uranus: '天王星', Neptune: '海王星', Pluto: '冥王星' };
  const TRADITIONAL_RULER = ['火星', '金星', '水星', '月', '太陽', '水星', '金星', '火星', '木星', '土星', '土星', '木星'];
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

  function normDeg(value) {
    return ((value % 360) + 360) % 360;
  }

  function signedAngularDiff(current, target) {
    return ((normDeg(current) - normDeg(target) + 540) % 360) - 180;
  }

  function dateFromLocal(input) {
    return new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour - input.timezoneOffset, input.minute || 0, input.second || 0));
  }

  function dateFromYmdUtc(date) {
    return new Date(Date.UTC(date.year, date.month - 1, date.day, date.hour || 0, date.minute || 0, date.second || 0));
  }

  function astronomyTimeValue(date) {
    if (typeof date === 'number') return date;
    if (date && typeof date.ut === 'number') return date;
    if (date && typeof date.getTime === 'function') {
      return (date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;
    }
    return date;
  }

  function eclipticLongitude(body, date) {
    if (!Astronomy) throw new Error('Astronomy Engine is not loaded');
    const time = astronomyTimeValue(date);
    if (body === 'Moon') return Astronomy.EclipticGeoMoon(time).lon;
    return Astronomy.Ecliptic(Astronomy.GeoVector(body, time, true)).elon;
  }

  function searchSunLongitude(targetLongitude, searchStart, days) {
    const startMs = searchStart.getTime();
    const endMs = startMs + days * 86400000;
    const coarseStepMs = 6 * 3600000;
    let bestMs = startMs;
    let bestAbsDiff = Infinity;

    for (let ms = startMs; ms <= endMs; ms += coarseStepMs) {
      const diff = Math.abs(signedAngularDiff(eclipticLongitude('Sun', new Date(ms)), targetLongitude));
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
      const leftDiff = Math.abs(signedAngularDiff(eclipticLongitude('Sun', new Date(left)), targetLongitude));
      const rightDiff = Math.abs(signedAngularDiff(eclipticLongitude('Sun', new Date(right)), targetLongitude));
      if (leftDiff < rightDiff) hi = right;
      else lo = left;
    }

    return { date: new Date((lo + hi) / 2) };
  }


  function longitudeParts(longitude) {
    const normalized = normDeg(longitude);
    const signIndex = Math.floor(normalized / 30);
    const within = normalized - signIndex * 30;
    const degree = Math.floor(within);
    const minuteFloat = (within - degree) * 60;
    const minute = Math.floor(minuteFloat);
    const secondRaw = Math.floor((minuteFloat - minute) * 60 + 0.5);
    const finalMinute = secondRaw >= 60 ? minute + 1 : minute;
    const second = secondRaw >= 60 ? 0 : secondRaw;
    const finalDegree = finalMinute >= 60 ? degree + 1 : degree;
    const minuteOut = finalMinute >= 60 ? 0 : finalMinute;
    const signOut = finalDegree >= 30 ? (signIndex + 1) % 12 : signIndex;
    const degreeOut = finalDegree >= 30 ? 0 : finalDegree;
    return {
      longitude: Number(normalized.toFixed(6)),
      sign_index: signOut,
      sign_en3: SIGNS[signOut].en3,
      sign_ja: SIGNS[signOut].ja,
      degree: degreeOut,
      minute: minuteOut,
      second
    };
  }

  function planetRows(date, bodies) {
    return (bodies || BODIES).map((body) => ({
      body,
      body_ja: BODY_JA[body],
      ...longitudeParts(eclipticLongitude(body, date))
    }));
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

  function majorTransitAspects(transitRows, natalRows, maxResults) {
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
      .slice(0, maxResults || 8);
  }

  function ageAtDate(input, date) {
    let age = date.year - input.year;
    if (date.month < input.month || (date.month === input.month && date.day < input.day)) age -= 1;
    return age;
  }

  function progressedAgeYears(input, targetDate) {
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

  function annualProfection(input, targetDate, ascLongitude) {
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

  function monthlyProfection(input, targetDate, ascLongitude, monthIndex) {
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

  function secondaryProgressions(input, targetDate, bodies) {
    const birthDate = dateFromLocal(input);
    const ageYears = progressedAgeYears(input, targetDate);
    const progressedDate = new Date(birthDate.getTime() + ageYears * 86400000);
    return {
      method: 'secondary_progression',
      rule: 'one day after birth equals one year of life; target date is evaluated at the native birth time and interpolated between birthdays',
      progressed_date_utc: progressedDate.toISOString(),
      age_years: Number(ageYears.toFixed(9)),
      planets: planetRows(progressedDate, bodies || BODIES)
    };
  }

  function transits(targetDate, bodies) {
    const target = dateFromYmdUtc(targetDate);
    return {
      method: 'transits',
      target_date_utc: target.toISOString(),
      planets: planetRows(target, bodies || BODIES)
    };
  }

  function solarReturn(input, returnYear) {
    const birthDate = dateFromLocal(input);
    const natalSunLongitude = eclipticLongitude('Sun', birthDate);
    const searchStart = new Date(Date.UTC(returnYear, input.month - 1, input.day - 10, 0, 0, 0));
    const event = searchSunLongitude(natalSunLongitude, searchStart, 25);
    return {
      method: 'solar_return',
      return_year: returnYear,
      natal_sun_longitude: Number(normDeg(natalSunLongitude).toFixed(6)),
      return_time_utc: event.date.toISOString(),
      planets: planetRows(event.date)
    };
  }

  function yearlyTimingRow(input, ascLongitude, natalRows, currentAge, offsetFromCurrent) {
    const age = currentAge + offsetFromCurrent;
    const periodStart = anniversaryDate(input, age);
    const periodEnd = anniversaryDate(input, age + 1);
    const profection = annualProfection(input, periodStart, ascLongitude);
    const progressions = secondaryProgressions(input, periodStart, PROGRESSED_YEAR_MARKERS);
    const longTermTransits = transits(periodStart, OUTER_BODIES);

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

  function pastPresentFutureFlow(input, targetDate, ascLongitude, yearsBack, yearsForward) {
    const startAge = ageAtDate(input, targetDate);
    const natalRows = planetRows(dateFromLocal(input), BODIES);
    const rows = [];
    const back = yearsBack == null ? 10 : yearsBack;
    const forward = yearsForward == null ? 10 : yearsForward;

    for (let offset = -back; offset <= forward; offset += 1) {
      rows.push(yearlyTimingRow(input, ascLongitude, natalRows, startAge, offset));
    }

    const past = rows.filter((row) => row.phase === 'past');
    const current = rows.find((row) => row.phase === 'current') || null;
    const future = rows.filter((row) => row.phase === 'future');
    return {
      method: 'past_present_future_flow',
      rule: 'past ten profection years, the current active profection year, and future ten profection years; yearly snapshots use secondary progressed Sun/Moon and Jupiter-Pluto transits at each birthday period start',
      start_age: startAge,
      years_back: back,
      years_forward: forward,
      past,
      current,
      future,
      years: rows
    };
  }

  function monthlyTimingRow(input, ascLongitude, natalRows, periodStart, periodEnd, offsetFromTarget) {
    const profection = monthlyProfection(input, periodStart, ascLongitude);
    const progressions = secondaryProgressions(input, periodStart, PROGRESSED_YEAR_MARKERS);
    const monthTransits = transits(periodStart, BODIES);
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

  function futureOneYearMonthlyFlow(input, targetDate, ascLongitude) {
    const natalRows = planetRows(dateFromLocal(input), BODIES);
    const months = [];

    for (let monthOffset = 0; monthOffset < 12; monthOffset += 1) {
      const periodStart = addMonthsToYmd(targetDate, monthOffset);
      const periodEnd = addMonthsToYmd(targetDate, monthOffset + 1);
      months.push(monthlyTimingRow(input, ascLongitude, natalRows, periodStart, periodEnd, monthOffset));
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

  function calculate(input, targetDate, ascLongitude) {
    const centeredFlow = pastPresentFutureFlow(input, targetDate, ascLongitude);
    const monthlyFlow = futureOneYearMonthlyFlow(input, targetDate, ascLongitude);
    return {
      schema: 'established-astrology-timing/v1',
      engine: 'Astronomy Engine',
      engine_source: 'vendor/astronomy-engine/astronomy.js',
      input,
      target_date: targetDate,
      transits: transits(targetDate),
      secondary_progressions: secondaryProgressions(input, targetDate),
      solar_return: solarReturn(input, targetDate.year),
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

  global.EstablishedTimingCalculator = {
    calculate,
    longitudeParts,
    planetRows,
    majorTransitAspects
  };
})(typeof window !== 'undefined' ? window : globalThis);
