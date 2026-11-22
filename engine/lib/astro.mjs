import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const exec=promisify(execFile),root=process.env.LAMBDA_TASK_ROOT ? path.join(process.env.LAMBDA_TASK_ROOT,'engine')+path.sep : fileURLToPath(new URL('../',import.meta.url));
export const norm=x=>{const r=x%360;return r<0?r+360:r;};
const snap=x=>Math.abs(x-Math.round(x))<1e-12?Math.round(x):x;
export const signOf=x=>Math.floor(norm(x)/30);
export const navamsaOf=x=>Math.floor(snap(norm(x)*3/10))%12;
export const nakshatraOf=x=>{const u=snap(norm(x)*3/40),whole=Math.floor(u),fraction=u-whole;return {index:whole%27,pada:Math.floor(snap(fraction*4))+1,fraction};};
export const ORDER=['ketu','venus','sun','moon','mars','rahu','jupiter','saturn','mercury'];
export const YEARS={ketu:7,venus:20,sun:6,moon:10,mars:7,rahu:18,jupiter:16,saturn:19,mercury:17};
export const IDS=['sun','moon','mercury','venus','mars','jupiter','saturn','rahu'];
export const LORDS=['mars','venus','mercury','moon','sun','mercury','venus','mars','jupiter','saturn','saturn','jupiter'];
export async function ephemeris(ms,{lat,lon,ayanamsa=1,node='mean'},n=1,step=0,houses=true){
 const {stdout}=await exec(root+'bin/vedic-swiss',[root+'vendor/swiss/ephe',String(ms),String(lat),String(lon),String(ayanamsa),node==='true'?'1':'0',String(n),String(step),houses?'1':'0'],{timeout:30000,maxBuffer:6*1024*1024});
 const r=JSON.parse(stdout);
 r.samples=r.samples.map(s=>({...s,planets:[...s.planets.map((p,i)=>({...p,key:IDS[i]})),{...s.planets[7],key:'ketu',lon:norm(s.planets[7].lon+180)}]}));return r;
}
export function decorate(sample,asc=sample.asc){
 const lagna=asc===null?null:signOf(asc);
 return {...sample,lagna,planets:sample.planets.map(p=>({...p,sign:signOf(p.lon),degree:norm(p.lon)%30,house:lagna===null?null:(signOf(p.lon)-lagna+12)%12+1,d9:navamsaOf(p.lon),nak:nakshatraOf(p.lon),retro:p.speed<0}))};
}
export function aspects(planets){
 const result=[];
 for(const p of planets.filter(p=>!['rahu','ketu'].includes(p.key))){
  const distances={mars:[4,7,8],jupiter:[5,7,9],saturn:[3,7,10]}[p.key]||[7];
  for(const q of planets){if(q===p)continue;const d=(q.sign-p.sign+12)%12+1;if(distances.includes(d))result.push({from:p.key,to:q.key,distance:d});}
 }return result;
}
export function mahadashas(birthMs,moonLon,yearDays=365.25){
 const nak=nakshatraOf(moonLon),idx=nak.index%9,unit=yearDays*86400000;
 let start=birthMs-nak.fraction*YEARS[ORDER[idx]]*unit;const out=[];
 for(let k=0;k<27;k++){const key=ORDER[(idx+k)%9],end=start+YEARS[key]*unit;out.push({key,start,end});start=end;}return out;
}
export function antardashas(maha){const first=ORDER.indexOf(maha.key);let start=maha.start;return ORDER.map((_,i)=>{const key=ORDER[(first+i)%9],end=i===8?maha.end:start+(maha.end-maha.start)*YEARS[key]/120;const r={key,start,end};start=end;return r;});}
export function activePeriod(periods,ms){return periods.find(p=>ms>=p.start&&ms<p.end)||null;}
export function dignity(p){
 const exalt={sun:0,moon:1,mars:9,mercury:5,jupiter:3,venus:11,saturn:6};
 if(['rahu','ketu'].includes(p.key))return 'node';
 if(exalt[p.key]===p.sign)return 'exalted';
 if((exalt[p.key]+6)%12===p.sign)return 'debilitated';
 if(LORDS[p.sign]===p.key)return 'own';return 'normal';
}
/* A five-minute grid bounds movement; each changed boundary is bisected to <1 sec. */
export async function variableRanges(start,end,settings,selector){
 const n=Math.ceil((end-start)/300000)+1,step=(end-start)/1000/(n-1);
 const {samples}=await ephemeris(start,settings,n,step,false);const ranges=[];let current=selector(samples[0]),from=start;
 for(let i=1;i<samples.length;i++){
  const value=selector(samples[i]);if(value===current)continue;
  let lo=samples[i-1].ms,hi=samples[i].ms;
  while(hi-lo>500){const mid=(lo+hi)/2;const s=(await ephemeris(mid,settings,1,0,false)).samples[0];if(selector(s)===current)lo=mid;else hi=mid;}
  ranges.push({value:current,start:from,end:hi});from=hi;current=value;
 }
 ranges.push({value:current,start:from,end});return ranges;
}
