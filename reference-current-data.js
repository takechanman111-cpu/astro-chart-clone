(function (global) {
  'use strict';

  global.AstrologyReferenceCloneData = {
    schema: 'astrology-readings-online-source-output/v1',
    source_site: 'Astrology Readings Online',
    captured_on: '2026-06-11',
    source_urls: {
      transits: 'https://astrologyreadings.online/transits-progression/<redacted-chart-id>/2026/06/11/',
      secondary_progressions: 'https://astrologyreadings.online/tertiary-minor-progressions/<redacted-chart-id>/2026/06/11/',
      solar_return: 'https://astrologyreadings.online/solar-return/<redacted-chart-id>/?start_year=2026',
      annual_profections: 'https://astrologyreadings.online/time-lords/<redacted-chart-id>/'
    },
    test_input: {
      birth_date: '1990-01-01',
      birth_time: '12:00',
      timezone: 'Asia/Tokyo UTC+9',
      birthplace: 'Osaka, Japan',
      latitude: 34.69,
      longitude: 135.5,
      target_date: '2026-06-11'
    },
    annual_profections: {
      current: {
        age: 36,
        label: '36 now',
        starts: '1 Jan 2026',
        house: 1,
        sign_en: 'Aries',
        sign_ja: '牡羊座',
        lord_en: 'Mars',
        lord_ja: '火星'
      },
      rows: [
        { age: 30, starts: '1 Jan 2020', house: 7, sign_en: 'Libra', sign_ja: '天秤座', lord_en: 'Venus', lord_ja: '金星' },
        { age: 31, starts: '1 Jan 2021', house: 8, sign_en: 'Scorpio', sign_ja: '蠍座', lord_en: 'Mars', lord_ja: '火星' },
        { age: 32, starts: '1 Jan 2022', house: 9, sign_en: 'Sagittarius', sign_ja: '射手座', lord_en: 'Jupiter', lord_ja: '木星' },
        { age: 33, starts: '1 Jan 2023', house: 10, sign_en: 'Capricorn', sign_ja: '山羊座', lord_en: 'Saturn', lord_ja: '土星' },
        { age: 34, starts: '1 Jan 2024', house: 11, sign_en: 'Aquarius', sign_ja: '水瓶座', lord_en: 'Saturn', lord_ja: '土星' },
        { age: 35, starts: '1 Jan 2025', house: 12, sign_en: 'Pisces', sign_ja: '魚座', lord_en: 'Jupiter', lord_ja: '木星' },
        { age: 36, starts: '1 Jan 2026', house: 1, sign_en: 'Aries', sign_ja: '牡羊座', lord_en: 'Mars', lord_ja: '火星' }
      ]
    },
    solar_return: {
      year: 2026,
      planets: [
        { planet: 'Sun', planet_ja: '太陽', text: 'Cap 10° 25\' 56" (10)', sign_ja: '山羊座', degree: 10, minute: 25, second: 56, house: 10, longitude: 280.4322 },
        { planet: 'Moon', planet_ja: '月', text: 'Gem 04° 42\' 37" (2)', sign_ja: '双子座', degree: 4, minute: 42, second: 37, house: 2, longitude: 64.7103 },
        { planet: 'Mercury', planet_ja: '水星', text: 'Sag 28° 26\' 51" (9)', sign_ja: '射手座', degree: 28, minute: 26, second: 51, house: 9, longitude: 268.4475 },
        { planet: 'Venus', planet_ja: '金星', text: 'Cap 09° 02\' 17" (9)', sign_ja: '山羊座', degree: 9, minute: 2, second: 17, house: 9, longitude: 279.0381 },
        { planet: 'Mars', planet_ja: '火星', text: 'Cap 12° 35\' 08" (10)', sign_ja: '山羊座', degree: 12, minute: 35, second: 8, house: 10, longitude: 282.5856 },
        { planet: 'Jupiter', planet_ja: '木星', text: 'Can 21° 22\' 30" (4)', sign_ja: '蟹座', degree: 21, minute: 22, second: 30, house: 4, longitude: 111.375 },
        { planet: 'Saturn', planet_ja: '土星', text: 'Pis 26° 09\' 34" (12)', sign_ja: '魚座', degree: 26, minute: 9, second: 34, house: 12, longitude: 356.1594 },
        { planet: 'Uranus', planet_ja: '天王星', text: 'Tau 27° 57\' 11" (2)', sign_ja: '牡牛座', degree: 27, minute: 57, second: 11, house: 2, longitude: 57.9531 },
        { planet: 'Neptune', planet_ja: '海王星', text: 'Pis 29° 30\' 19" (12)', sign_ja: '魚座', degree: 29, minute: 30, second: 19, house: 12, longitude: 359.5053 },
        { planet: 'Pluto', planet_ja: '冥王星', text: 'Aqu 02° 42\' 53" (10)', sign_ja: '水瓶座', degree: 2, minute: 42, second: 53, house: 10, longitude: 302.7147 }
      ],
      angles: {
        ascendant: { text: 'Sag 21° 19\' 55"', sign_ja: '射手座', degree: 21, minute: 19, second: 55, longitude: 261.3319 },
        midheaven: { text: 'Lib 08° 28\' 12"', sign_ja: '天秤座', degree: 8, minute: 28, second: 12, longitude: 188.47 }
      }
    },
    secondary_progressions: {
      target_date: '2026-06-11',
      planets: [
        { planet: 'Sun', planet_ja: '太陽', text: 'Aqu 17° 30\' 25" (11)', sign_ja: '水瓶座', degree: 17, minute: 30, second: 25, house: 11, longitude: 317.5069 },
        { planet: 'Moon', planet_ja: '月', text: 'Can 07° 01\' 55" (3)', sign_ja: '蟹座', degree: 7, minute: 1, second: 55, house: 3, longitude: 97.0319 },
        { planet: 'Mercury', planet_ja: '水星', text: 'Cap 22° 57\' 32" (10)', sign_ja: '山羊座', degree: 22, minute: 57, second: 32, house: 10, longitude: 292.9589 },
        { planet: 'Venus', planet_ja: '金星', text: 'Cap 20° 59\' 19" R (10)', sign_ja: '山羊座', degree: 20, minute: 59, second: 19, house: 10, longitude: 290.9886, retrograde: true },
        { planet: 'Mars', planet_ja: '火星', text: 'Cap 05° 45\' 34" (9)', sign_ja: '山羊座', degree: 5, minute: 45, second: 34, house: 9, longitude: 275.7594 }
      ]
    },
    transits: {
      target_date: '2026-06-11',
      planets: [
        { planet: 'Sun', planet_ja: '太陽', text: 'Gem 20° 06\' 38" (3)', sign_ja: '双子座', degree: 20, minute: 6, second: 38, house: 3, longitude: 80.1106 },
        { planet: 'Moon', planet_ja: '月', text: 'Ari 22° 35\' 28" (1)', sign_ja: '牡羊座', degree: 22, minute: 35, second: 28, house: 1, longitude: 22.5911 },
        { planet: 'Mercury', planet_ja: '水星', text: 'Can 13° 55\' 36" (4)', sign_ja: '蟹座', degree: 13, minute: 55, second: 36, house: 4, longitude: 103.9267 },
        { planet: 'Venus', planet_ja: '金星', text: 'Can 27° 08\' 34" (4)', sign_ja: '蟹座', degree: 27, minute: 8, second: 34, house: 4, longitude: 117.1428 },
        { planet: 'Mars', planet_ja: '火星', text: 'Tau 17° 07\' 32" (1)', sign_ja: '牡牛座', degree: 17, minute: 7, second: 32, house: 1, longitude: 47.1256 },
        { planet: 'Jupiter', planet_ja: '木星', text: 'Can 26° 00\' 37" (4)', sign_ja: '蟹座', degree: 26, minute: 0, second: 37, house: 4, longitude: 116.0103 },
        { planet: 'Saturn', planet_ja: '土星', text: 'Ari 13° 01\' 42" (12)', sign_ja: '牡羊座', degree: 13, minute: 1, second: 42, house: 12, longitude: 13.0283 },
        { planet: 'Uranus', planet_ja: '天王星', text: 'Gem 02° 38\' 11" (2)', sign_ja: '双子座', degree: 2, minute: 38, second: 11, house: 2, longitude: 62.6364 },
        { planet: 'Neptune', planet_ja: '海王星', text: 'Ari 04° 13\' 41" (12)', sign_ja: '牡羊座', degree: 4, minute: 13, second: 41, house: 12, longitude: 4.2281 },
        { planet: 'Pluto', planet_ja: '冥王星', text: 'Aqu 05° 14\' 03" R (11)', sign_ja: '水瓶座', degree: 5, minute: 14, second: 3, house: 11, longitude: 305.2342, retrograde: true }
      ],
      transit_to_natal_aspects: [
        { transit: 'Sun', aspect: 'Trine 120°', natal: 'North Node', orb: '1° 39′' },
        { transit: 'Mercury', aspect: 'Opposition 180°', natal: 'Saturn', orb: '1° 41′' },
        { transit: 'Mercury', aspect: 'Opposition 180°', natal: 'Neptune', orb: '1° 54′' },
        { transit: 'Jupiter', aspect: 'Opposition 180°', natal: 'Mercury', orb: '0° 14′' },
        { transit: 'Saturn', aspect: 'Square 90°', natal: 'Neptune', orb: '1° 0′' }
      ]
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
