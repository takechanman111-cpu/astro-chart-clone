import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateTimingPayload, sanitizeTimingPayload } from './timing_server.mjs';
import { localDayInterval, calculateUnknownBirthTime, possibleHiddenTurn } from './unknown_birth_time.mjs';
import { swissPositionSeries, validateSwissSeriesOutput } from './established_timing_calculator.mjs';

const payload=(year=1990,month=1,day=1)=>({input:{year,month,day,hour:12,minute:0,
  birthTimeUnknown:true,prefectureIndex:26,timezoneOffset:9,latitude:34.69,longitude:135.5},
  targetDate:{year:2026,month:9,day:10}});

test('unknown remains null, even when a placeholder time is supplied',()=>{
  const s=sanitizeTimingPayload(payload());
  assert.equal(s.input.hour,null); assert.equal(s.input.minute,null);
  assert.equal(s.input.birthTimeUnknown,true);
});

test('known input retains the old contract',()=>{
  const p=payload(); delete p.input.birthTimeUnknown;
  const s=sanitizeTimingPayload(p);
  assert.equal(s.input.hour,12); assert.equal(s.input.birthTimeUnknown,undefined);
});

test('invalid dates and malformed mode are rejected',()=>{
  assert.throws(()=>sanitizeTimingPayload(payload(1990,2,30)),/日付/);
  const p=payload(); p.input.birthTimeUnknown='true';
  assert.throws(()=>sanitizeTimingPayload(p),/不正/);
});

test('unsupported locations are rejected, not converted to Japan',()=>{
  for(const [prefectureIndex,timezoneOffset] of [[47,9],[46,9],[26,8]]) {
    const p=payload(); Object.assign(p.input,{prefectureIndex,timezoneOffset});
    assert.throws(()=>sanitizeTimingPayload(p),/まだ対応/);
  }
  const p=payload(); delete p.input.prefectureIndex;
  assert.throws(()=>sanitizeTimingPayload(p));
});

test('Japanese historical summer-time day is not forced to 24 hours',()=>{
  const interval=localDayInterval({year:1948,month:5,day:2});
  assert.equal((interval.end-interval.start)/3600000,23);
  assert.equal(new Date(interval.start).toISOString(),'1948-05-01T15:00:00.000Z');
});

test('modern local day and half-open next-day boundary',()=>{
  const interval=localDayInterval({year:2000,month:2,day:29});
  assert.equal(new Date(interval.start).toISOString(),'2000-02-28T15:00:00.000Z');
  assert.equal(new Date(interval.end).toISOString(),'2000-02-29T15:00:00.000Z');
});

test('real Swiss full day finds Moon sign change and has no fabricated houses/timing',()=>{
  const d=calculateTimingPayload(payload());
  assert.equal(d.schema,'unknown-birth-time/v1'); assert.equal(d.planets.length,10); assert.equal(d.points.length,4);
  assert.equal(d.planets[1].sign.status,'conditional'); assert.deepEqual(d.planets[1].sign.candidates,[10,11]);
  assert(d.events.some(e=>e.type==='sign'&&e.body==='Moon'));
  assert(d.events.every(e=>Date.parse(e.to_utc)-Date.parse(e.from_utc)<=1000));
  for(const key of ['angles','houses','annual_profection','solar_return','secondary_progressions','natal_chart']) assert.equal(d[key],undefined);
  assert([...d.planets,...d.points].every(p=>p.house===undefined));
  assert.equal(d.input.hour,null); assert(d.verification.sample_count>577);
  assert.equal(d.verification.mathematical_interval_proof,false);
  // Separate off-grid Swiss calls are contained in the calculated ranges.
  for(const hour of [1,7,17,23]) {
    const at=Date.parse(d.interval.start_utc)+hour*3600000+37000;
    const sample=swissPositionSeries(new Date(at),1)[0];
    d.planets.forEach((p,i)=>{
      const lon=p.min_longitude+(((sample.rows[i].longitude-p.min_longitude+540)%360)-180);
      assert(lon>=p.min_longitude-0.0001&&lon<=p.max_longitude+0.0001);
    });
  }
});

test('real Swiss Moon stable day still keeps separate degree and Sabian uncertainty',()=>{
  const d=calculateTimingPayload(payload(1990,1,2));
  assert.equal(d.planets[1].sign.status,'common');
  assert.equal(d.planets[1].sabian.status,'conditional');
  assert(d.planets[1].max_longitude-d.planets[1].min_longitude>10);
});

test('real Swiss Sun ingress is conditional rather than assumed stable',()=>{
  const d=calculateTimingPayload(payload(2000,3,20));
  assert.equal(d.planets[0].sign.status,'conditional');
  assert(d.planets[0].sign.candidates.includes(11)); assert(d.planets[0].sign.candidates.includes(0));
});

test('real Swiss Mercury station is conditional and located inside day',()=>{
  const d=calculateTimingPayload(payload(2026,6,30));
  assert.equal(d.planets[2].motion.status,'conditional');
  const station=d.events.find(e=>e.body==='Mercury'&&e.type==='station');
  assert(station);
  const before=swissPositionSeries(new Date(Date.parse(station.from_utc)-1000),1)[0].rows[2].speed;
  const after=swissPositionSeries(new Date(Date.parse(station.to_utc)+1000),1)[0].rows[2].speed;
  assert(before>0&&after<0);
});

test('same-time aspects do not combine independent planetary extrema',()=>{
  const input=sanitizeTimingPayload(payload()).input;
  const start=localDayInterval(input).start;
  const series=(date,count=1,step=150)=>Array.from({length:count},(_,k)=>{
    const time=date.getTime()+k*step*1000,days=(time-start)/86400000;
    return {time,rows:['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','mean Node','Chiron','mean Apogee'].map((body,i)=>({
      body,longitude:i===0?10+10*days:i===1?130+10*days:170+i*7,speed:i<2?10:0
    }))};
  });
  const d=calculateUnknownBirthTime(input,{series});
  const a=d.aspects.find(a=>a.first==='太陽'&&a.second==='月'&&a.angle===120);
  assert.notEqual(a.status,'conditional'); assert(a.max_orb<0.000001);
});

test('missing Swiss longitude or speed must not become zero',()=>{
  for(const output of ['Sun,,1.0','Sun,20.0,','Sun,NaN,1.0']) assert.throws(()=>validateSwissSeriesOutput(output));
  assert.doesNotThrow(()=>validateSwissSeriesOutput('Sun,0.0,0.0'));
});

test('same-sign speed triple can contain a hidden near-station',()=>{
  assert.equal(possibleHiddenTurn(0.03,0.08,0.63),true);
  assert.equal(possibleHiddenTurn(-0.03,-0.08,-0.63),true);
  assert.equal(possibleHiddenTurn(0.5,0.6,0.7),false);
});

test('unobserved relative-speed turn propagates to an unresolved aspect',()=>{
  const input=sanitizeTimingPayload(payload()).input;
  const start=localDayInterval(input).start;
  const series=(date,count=1,step=150)=>Array.from({length:count},(_,k)=>{
    const time=date.getTime()+k*step*1000,days=(time-start)/86400000,t=(time-start)/300000;
    const integral=t<=1?t*t*t/3-.2*t*t+.03*t:1/3-.2+.03+.63*(t-1);
    const speed=t<=1?(t-.2)**2-.01:.63;
    return {time,rows:['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','mean Node','Chiron','mean Apogee'].map((body,i)=>({
      body,longitude:i===0?10+days+integral/288:i===1?130+days:170+i*7+days*.001,
      speed:i===0?1+speed:i===1?1:.001
    }))};
  });
  const d=calculateUnknownBirthTime(input,{series});
  const aspect=d.aspects.find(a=>a.first==='太陽'&&a.second==='月'&&a.angle===120);
  assert.equal(aspect.status,'unresolved');
  assert(aspect.max_orb<1);
});

test('a sign reached only at next-day midnight is not an observed birth candidate',()=>{
  const input=sanitizeTimingPayload(payload()).input;
  const start=localDayInterval(input).start;
  const series=(date,count=1,step=150)=>Array.from({length:count},(_,k)=>{
    const time=date.getTime()+k*step*1000,days=(time-start)/86400000;
    return {time,rows:['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','mean Node','Chiron','mean Apogee'].map((body,i)=>({
      body,longitude:i===0?29+days:100+i*12.3,speed:i===0?1:0
    }))};
  });
  const d=calculateUnknownBirthTime(input,{series});
  assert.equal(d.planets[0].sign.status,'unresolved');
  assert.equal(d.balance[0].items[0].min,d.balance[0].items[0].max);
});
