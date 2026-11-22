import {CITIES} from '../public/cities.mjs';
import {SIGNS,NAKS} from '../public/data.mjs';
import {resolveLocal,dayRange,today} from './time.mjs';
import {ephemeris,decorate,mahadashas,antardashas,activePeriod,signOf,navamsaOf,nakshatraOf,aspects} from './astro.mjs';
import {natalReading,periodReading,lifeAreas,transitReading,d9Reading,sources} from './readings.mjs';

function validateDate(s,label){const d=new Date(String(s)+'T00:00:00Z');if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)throw new Error(`${label}を正しく入力してください。`);return s;}
export function validate(input){
 const date=validateDate(input.date,'生年月日'),asOf=validateDate(input.asOf||today(),'運勢を見る日');
 if(date<'1900-01-01'||date>'2099-12-31')throw new Error('生年月日は1900年〜2099年に対応しています。');
 if(asOf<date||asOf>'2199-12-31')throw new Error('運勢を見る日は出生当日以降、2199年までを指定してください。');
 if((new Date(asOf)-new Date(date))/86400000>150*366)throw new Error('運勢を見る日は出生から150年以内を指定してください。');
 let place;
 if(input.city!=='custom'){place=CITIES.find(p=>p.id===input.city);if(!place)throw new Error('出生地を候補から選んでください。');}
 else {const lat=Number(input.lat),lon=Number(input.lon),zone=String(input.zone||'');
  if(input.lat===''||input.lon===''||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>89||Math.abs(lon)>180)throw new Error('緯度は−89〜89度、経度は−180〜180度で入力してください。');
  try{new Intl.DateTimeFormat('ja',{timeZone:zone}).format(0);}catch{throw new Error('タイムゾーンを選んでください。');}
  place={id:'custom',name:String(input.placeName||'指定した出生地').slice(0,60),lat,lon,zone};
 }
 const accuracy=['exact','approximate','unknown'].includes(input.accuracy)?input.accuracy:'exact';
 const time=accuracy==='unknown'?'12:00':input.time;
 if(!time)throw new Error('出生時刻を入力するか「時刻が分からない」を選んでください。');
 const birth=resolveLocal(date,time,place.zone,input.fold==='later'?'later':'earlier');
 const ayanamsa={lahiri:1,raman:3,krishnamurti:5}[input.ayanamsa||'lahiri'];if(ayanamsa===undefined)throw new Error('計算方式を確認してください。');
 const yearDays=Number(input.yearDays||365.25);if(![365.25,365.256364,360].includes(yearDays))throw new Error('ダシャーの年換算を確認してください。');
 const node=input.node||'mean';if(!['mean','true'].includes(node))throw new Error('交点の種類を確認してください。');
 const margin=Number(input.margin||15);if(![5,15,30,60].includes(margin))throw new Error('時刻の幅を選んでください。');
 return {date,time,asOf,place,accuracy,birth,margin,yearDays,ayanamsa,node};
}

export async function calculate(input){
 const v=validate(input),settings={...v.place,ayanamsa:v.ayanamsa,node:v.node};
 const viewTime=resolveLocal(v.asOf,'12:00','Asia/Tokyo').ms;
 if(v.accuracy!=='unknown'&&viewTime<v.birth.ms)throw new Error('運勢を見る日の日本時間12時が出生時刻より前です。翌日以降を選んでください。');
 const raw=await ephemeris(v.birth.ms,settings,1,0,v.accuracy!=='unknown');
 let chart=decorate(raw.samples[0]),sampleRange=null,uncertainty=null;
 if(v.accuracy!=='exact'){
  const day=v.accuracy==='unknown'?dayRange(v.date,v.place.zone):{start:v.birth.ms-v.margin*60000,end:v.birth.ms+v.margin*60000};
  const n=Math.ceil((day.end-day.start)/(v.accuracy==='unknown'?300000:30000))+1;
  const samples=(await ephemeris(day.start,settings,n,(day.end-day.start-(v.accuracy==='unknown'?1:0))/1000/(n-1),v.accuracy==='approximate')).samples;
  sampleRange={day,samples};
  const stableKeys=chart.planets.filter(p=>samples.every(s=>signOf(s.planets.find(q=>q.key===p.key).lon)===p.sign)).map(p=>p.key);
  const stableAsc=v.accuracy==='approximate'&&samples.every(s=>signOf(s.asc)===chart.lagna);
  const stableD9Asc=stableAsc&&samples.every(s=>navamsaOf(s.asc)===navamsaOf(chart.asc));
  const stableNak=samples.every(s=>nakshatraOf(s.planets[1].lon).index===chart.planets[1].nak.index&&nakshatraOf(s.planets[1].lon).pada===chart.planets[1].nak.pada);
  uncertainty={start:day.start,end:day.end,stableKeys,stableAsc,stableD9Asc,stableNak,nominal:chart};
  if(!stableAsc)chart=decorate({...chart,asc:null},null);
 }
 const stableKeys=uncertainty?.stableKeys||null;
 const readings=natalReading(chart,stableKeys);
 if(uncertainty?.stableNak&&stableKeys?.includes('moon'))readings.nak=natalReading(chart).nak;
 const unknownCandidates=[];
 if(v.accuracy==='unknown'){
  // Detect Moon sign/nakshatra/pada changes, then refine each actual crossing.
  const samples=sampleRange.samples,selector=s=>{const p=s.planets[1],n=nakshatraOf(p.lon);return `${signOf(p.lon)}:${n.index}:${n.pada}`;};
  let state=selector(samples[0]),start=sampleRange.day.start;
  for(let i=1;i<samples.length;i++)if(selector(samples[i])!==state){
   let lo=samples[i-1].ms,hi=samples[i].ms;
   while(hi-lo>500){const m=(hi+lo)/2;if(selector((await ephemeris(m,settings,1,0,false)).samples[0])===state)lo=m;else hi=m;}
   unknownCandidates.push({state,start,end:hi});state=selector(samples[i]);start=hi;
  }
  unknownCandidates.push({state,start,end:sampleRange.day.end});
 }
 const transit=decorate((await ephemeris(viewTime,settings,1,0,false)).samples[0],null);
 let timing=null;
 if(v.accuracy!=='unknown'&&chart.lagna!==null){
  const periods=mahadashas(v.birth.ms,chart.planets[1].lon,v.yearDays),maha=activePeriod(periods,viewTime),antar=activePeriod(antardashas(maha),viewTime);
  const current=periodReading(maha,antar,chart),upcoming=[];
  for(const m of periods)for(const a of antardashas(m))if(a.start>viewTime&&upcoming.length<3)upcoming.push(periodReading(m,a,chart));
  timing={current,upcoming,maha,antar,periods:periods.filter(p=>p.end>=v.birth.ms&&p.start<viewTime+25*366*86400000),transits:transitReading(transit,chart)};
  if(uncertainty){
   const bound=sampleRange.samples.map(s=>{const ms=s.ms,ds=mahadashas(ms,s.planets[1].lon,v.yearDays),m=activePeriod(ds,viewTime),a=activePeriod(antardashas(m),viewTime);return {maha:m.key,antar:a.key,start:a.start,end:a.end};});
   timing.possible=bound.filter((x,i)=>bound.findIndex(y=>x.maha===y.maha&&x.antar===y.antar)===i);
   timing.range={startMin:Math.min(...bound.map(x=>x.start)),startMax:Math.max(...bound.map(x=>x.start)),endMin:Math.min(...bound.map(x=>x.end)),endMax:Math.max(...bound.map(x=>x.end))};
   if(timing.possible.length>1){timing.current=null;timing.upcoming=[];}
  }
 }
 return {schema:'vedic-beginner/1',input:{...v,birth:{ms:v.birth.ms,ambiguous:v.birth.ambiguous,offset:v.birth.offset}},engine:{version:raw.version,model:'Swiss Ephemeris',ayanamsa:v.ayanamsa,ayanamsaValue:chart.ayanamsa,node:v.node,yearDays:v.yearDays,house:'Whole sign',coordinate:'geocentric apparent sidereal',tzdb:process.versions.tz||'system',icu:process.versions.icu},chart,uncertainty:uncertainty?{...uncertainty,nominal:undefined}:null,readings,areas:chart.lagna===null?[]:lifeAreas(chart),d9:v.accuracy==='unknown'?[]:d9Reading(chart).filter(x=>!sampleRange||sampleRange.samples.every(s=>navamsaOf(s.planets.find(p=>p.key===x.key).lon)===chart.planets.find(p=>p.key===x.key).d9)),d9Asc:chart.asc!==null&&(!uncertainty||uncertainty.stableD9Asc)?navamsaOf(chart.asc):null,timing,unknownCandidates:unknownCandidates.map(x=>{const [sign,nak,pada]=x.state.split(':').map(Number);return {...x,visual:{sign,topic:'nakshatra',caption:`月：${SIGNS[sign].name}／${NAKS[nak][0]}`},sign,nak,pada,name:NAKS[nak][0],reading:NAKS[nak][2],moon:SIGNS[sign].moon};}),aspects:chart.lagna===null?[]:aspects(chart.planets),sources};
}
