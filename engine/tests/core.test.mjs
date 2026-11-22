import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {norm,signOf,navamsaOf,nakshatraOf,mahadashas,antardashas,activePeriod,ephemeris,decorate,aspects,YEARS} from '../lib/astro.mjs';
import {localCandidates,resolveLocal,dayRange} from '../lib/time.mjs';
import {calculate,validate} from '../lib/service.mjs';
import {SIGNS,NAKS,PLANETS} from '../public/data.mjs';
import {natalReading,planetReading,periodReading,lifeAreas} from '../lib/readings.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),base={date:'1990-01-01',time:'12:00',city:'26',asOf:'2026-11-14'};
const evidence={checkedAt:new Date().toISOString(),checks:[],reference:[],independent:[]};
test('all sign, nakshatra, pada and D9 boundaries retain half-open intervals',()=>{
 assert.equal(signOf(360),0);assert.equal(signOf(-0.000001),11);
 for(let i=0;i<12;i++){assert.equal(signOf(i*30),i);assert.equal(signOf(i*30+1e-7),i);assert.equal(signOf(i*30-1e-7),(i+11)%12);}
 for(let i=0;i<108;i++){const x=i*10/3;assert.equal(navamsaOf(x),i%12,`D9 at ${x}`);assert.equal(navamsaOf(x-1e-7),(i+11)%12);const n=nakshatraOf(x);assert.equal(n.index,Math.floor(i/4),`nak at ${x}`);assert.equal(n.pada,i%4+1,`pada at ${x}`);}
 evidence.checks.push('12 sign boundaries + 108 D9/pada boundaries');
});
test('textbook D9 examples are reproduced',()=>{assert.equal(navamsaOf(60+11),9);assert.equal(navamsaOf(210+19),8);});
test('dasha textbook balance and antardasha lengths',()=>{
 const birth=Date.UTC(2000,3,28),moon=300+2+23/60,ds=mahadashas(birth,moon,360);
 assert.equal(ds[0].key,'mars');assert.ok(Math.abs((ds[0].end-birth)/(360*86400000)-2.24875)<1e-9);
 const venus=ds.find(x=>x.key==='venus'),ads=antardashas(venus);assert.equal(ads[0].key,'venus');assert.equal(ads[1].key,'sun');
 assert.ok(Math.abs((ads[0].end-ads[0].start)/(360*86400000)-20*20/120)<1e-9);
 assert.ok(ads.some(x=>x.start<=venus.start&&x.end>venus.start));
 evidence.checks.push('Rao D9 Mercury 11 Gemini/Jupiter 19 Scorpio; Vimshottari 2.24875-year balance');
});
test('all 27 birth stars: periods continuous and birth is inside the full first MD/AD',()=>{
 for(let n=0;n<27;n++){const birth=Date.UTC(2000,0,1),ds=mahadashas(birth,n*40/3+7,365.25);assert.ok(ds[0].start<birth&&ds[0].end>birth);assert.ok(activePeriod(antardashas(ds[0]),birth));for(let i=0;i<ds.length;i++){if(i)assert.equal(ds[i-1].end,ds[i].start);const ads=antardashas(ds[i]);assert.equal(ads.at(-1).end,ds[i].end);for(let j=1;j<9;j++)assert.equal(ads[j-1].end,ads[j].start);assert.equal(activePeriod(ds,ds[i].start).key,ds[i].key);}}
 assert.equal(Object.values(YEARS).reduce((a,b)=>a+b),120);
});
test('historical Japanese DST and overseas ambiguous/missing times',()=>{
 assert.equal(resolveLocal('1950-07-01','12:00','Asia/Tokyo').offset,10);
 assert.equal(resolveLocal('1950-01-01','12:00','Asia/Tokyo').offset,9);
 assert.equal(resolveLocal('2000-01-01','12:00','Asia/Kolkata').offset,5.5);
 assert.equal(localCandidates('2026-11-01','01:30','America/New_York').length,2);
 assert.equal(localCandidates('2026-03-08','02:30','America/New_York').length,0);
 const d=dayRange('2026-11-01','America/New_York');assert.equal((d.end-d.start)/3600000,25);
 const s=dayRange('2026-03-08','America/New_York');assert.equal((s.end-s.start)/3600000,23);
 evidence.checks.push('Japan 1950 DST; Kolkata +5:30; New York 23/25-hour days and folds/gaps');
});
test('invalid dates, coordinates, settings and nonexistent local times reject',()=>{
 for(const x of [{date:'2001-02-29'},{date:'2000-13-01'},{time:'25:00'},{yearDays:366},{city:'bad'},{city:'custom',lat:'',lon:139,zone:'Asia/Tokyo'},{city:'custom',lat:35,lon:139,zone:'bad'},{city:'64',date:'2026-03-08',time:'02:30',asOf:'2026-11-14'}])assert.throws(()=>validate({...base,...x}),JSON.stringify(x));
});
test('Swiss adapter vs direct swetest, six dates and both nodes',async()=>{
 const fixture=JSON.parse(readFileSync(root+'tests/fixtures/swetest-reference.json','utf8'));
 for(const ref of fixture.cases){const {iso,node}=ref;
  const ms=Date.parse(iso),s=(await ephemeris(ms,{lat:34.6937,lon:135.5023,node})).samples[0];let max=0;
  for(let i=0;i<8;i++){const diff=Math.abs(s.planets[i].lon-ref.planets[i].lon);max=Math.max(max,diff);assert.ok(diff<1e-6,`${iso} ${node} body ${i} ${diff}`);}
  const asc=ref.asc;assert.ok(Math.abs(asc-s.asc)<1e-6);
  evidence.reference.push({iso,node,maxLongitudeDifferenceDegrees:max,ascDifferenceDegrees:Math.abs(asc-s.asc)});
 }
});
test('independent astronomy model comparison, 7 bodies x 4 epochs',async()=>{
 const require=createRequire(import.meta.url),A=require('./reference/astronomy.cjs');
 for(const iso of ['1900-01-01T12:00:00Z','1950-07-01T12:00:00Z','2000-01-01T12:00:00Z','2026-11-14T12:00:00Z']){
  const s=(await ephemeris(Date.parse(iso),{lat:35,lon:139})).samples[0];
  for(const [i,key] of ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'].entries()){
   const elon=A.Ecliptic(A.GeoVector(key,new Date(iso),true)).elon,delta=(norm(elon-norm(s.planets[i].lon+s.ayanamsa)+180)-180)*3600;
   assert.ok(Math.abs(delta)<60,`${iso} ${key} independent model delta ${delta} arcsec`);evidence.independent.push({iso,body:key,differenceArcsec:delta});
  }
 }
});
test('real calculations cover all 12 lagnas and all 27 moon stars',async()=>{
 const asc=new Set(),naks=new Set(),outputs=[];
 for(let hour=0;hour<24;hour++){const r=await calculate({...base,time:String(hour).padStart(2,'0')+':15'});asc.add(r.chart.lagna);assert.equal(r.readings.planets.length,9);assert.equal(r.areas.length,3);assert.equal(r.d9.length,9);assert.equal(r.timing.upcoming.length,3);assert.ok(!JSON.stringify(r.readings).includes('undefined'));outputs.push({hour,asc:r.chart.lagna,theme:r.timing.current.theme,title:r.readings.blocks[0].paragraphs[0].label});}
 for(let i=0;i<64;i++){const d=new Date(Date.UTC(1990,0,1)+i*12*3600000);const r=await calculate({...base,date:d.toISOString().slice(0,10),time:d.getUTCHours()===0?'00:00':'12:00'});naks.add(r.chart.planets[1].nak.index);}
 assert.equal(asc.size,12);assert.equal(naks.size,27);evidence.checks.push({realCharts:88,all12Lagnas:true,all27MoonStars:true,outputs});
});
test('unknown time removes houses, D9, dashas and unstable Moon, candidates continuous',async()=>{
 const r=await calculate({...base,accuracy:'unknown'});assert.equal(r.chart.lagna,null);assert.equal(r.timing,null);assert.equal(r.d9.length,0);assert.equal(r.areas.length,0);assert.ok(r.chart.planets.every(p=>p.house===null));assert.ok(!r.readings.blocks.some(x=>x.key==='asc'||x.key==='mind'));assert.ok(r.unknownCandidates.length>1);
 const xs=r.unknownCandidates;assert.equal(xs[0].start,dayRange(base.date,'Asia/Tokyo').start);assert.equal(xs.at(-1).end,dayRange(base.date,'Asia/Tokyo').end);for(let i=1;i<xs.length;i++)assert.equal(xs[i-1].end,xs[i].start);evidence.checks.push('unknown time: no invented ASC/house/D9/dasha; Moon candidates continuous');
});
test('approximate time exposes actual period-date ranges and unstable D9 asc',async()=>{
 const r=await calculate({...base,accuracy:'approximate'});assert.ok(r.uncertainty.stableAsc);assert.ok(!r.uncertainty.stableD9Asc);assert.equal(r.d9Asc,null);assert.ok(r.timing.range.startMin<r.timing.range.startMax);assert.ok(r.timing.range.endMin<r.timing.range.endMax);
 const cross=await calculate({...base,time:'12:00',accuracy:'approximate',margin:60});assert.equal(cross.chart.lagna,null);assert.equal(cross.timing,null);
});
test('ayanamsa/node/year/reference date choices change real results',async()=>{
 const a=await calculate(base),b=await calculate({...base,ayanamsa:'raman'}),c=await calculate({...base,node:'true'}),d=await calculate({...base,yearDays:360}),e=await calculate({...base,asOf:'2040-01-01'});
 assert.notEqual(a.chart.planets[1].lon,b.chart.planets[1].lon);assert.notEqual(a.chart.planets[7].lon,c.chart.planets[7].lon);assert.equal(a.chart.planets[1].lon,c.chart.planets[1].lon);assert.notEqual(a.timing.maha.start,d.timing.maha.start);assert.notEqual(a.timing.antar.start,e.timing.antar.start);
});
test('all 108 planet/sign descriptions and 27 nak descriptions have specific results',()=>{
 const fake=decorate({asc:0,planets:Object.keys(PLANETS).map((key,i)=>({key,lon:i*35,speed:1}))});
 for(const p of fake.planets)for(let sign=0;sign<12;sign++){const q={...p,sign,house:sign+1},r=planetReading(q,{...fake,planets:fake.planets.map(x=>x.key===q.key?q:x)});assert.ok(r.paragraphs[0].text.includes(SIGNS[sign].name));assert.ok(r.paragraphs.length>=4);assert.ok(r.basis.length>=2);}
 for(const n of NAKS)assert.ok(n[2].length>55&&n[3].length>8);
 assert.equal(NAKS.length,27);assert.equal(SIGNS.length,12);
});
test.after(()=>{writeFileSync(root+'review/calculation-evidence.json',JSON.stringify(evidence,null,2));});
