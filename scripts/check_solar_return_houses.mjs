import assert from 'node:assert/strict';
import {calculateTimingPayload} from './timing_server.mjs';
const input={year:1986,month:1,day:11,hour:22,minute:30,timezoneOffset:9,latitude:32.79,longitude:130.74};
const run=t=>calculateTimingPayload({input,targetDate:t,engineMode:'swetest'});
const data=run({year:2026,month:11,day:4}),s=data.solar_return;
assert.equal(s.houses.length,12); assert.equal(s.planets.length,10);
for(const p of s.planets){assert.ok(p.house>=1&&p.house<=12);const cusp=s.houses[p.house-1].longitude;assert.ok(((p.longitude-cusp+360)%360)<30.00001);}
assert.ok(Math.abs(s.planets[0].longitude-s.natal_sun_longitude)<0.0001);
assert.notEqual(s.houses[0].longitude,data.natal_chart.houses[0].longitude);
assert.equal(run({year:2026,month:1,day:1}).active_solar_return.return_year,2025);
console.log(JSON.stringify({verdict:'PASS',sun:s.planets[0],moon:s.planets[1],asc:s.angles.ascendant},null,2));
