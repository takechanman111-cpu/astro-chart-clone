const formatters=new Map();
function fmt(zone) {
 if(!formatters.has(zone))formatters.set(zone,new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));
 return formatters.get(zone);
}
export function partsAt(ms,zone){const p={};for(const x of fmt(zone).formatToParts(ms))if(x.type!=='literal')p[x.type]=Number(x.value);return p;}
export function offsetAt(ms,zone){const p=partsAt(ms,zone);return Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-Math.floor(ms/1000)*1000;}
export function localCandidates(date,time,zone){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}(?::\d{2})?$/.test(time))throw new Error('日付と時刻を確認してください。');
 const [y,m,d]=date.split('-').map(Number),[h,mi,s=0]=time.split(':').map(Number),guess=Date.UTC(y,m-1,d,h,mi,s),check=new Date(guess);
 if(check.getUTCFullYear()!==y||check.getUTCMonth()!==m-1||check.getUTCDate()!==d||h>23||mi>59||s>59)throw new Error('存在する日付と時刻を入力してください。');
 const offsets=new Set();for(let k=-36;k<=36;k+=6)offsets.add(offsetAt(guess+k*3600000,zone));
 return [...offsets].map(o=>guess-o).filter(ms=>{const p=partsAt(ms,zone);return p.year===y&&p.month===m&&p.day===d&&p.hour===h&&p.minute===mi&&p.second===s;}).sort((a,b)=>a-b);
}
export function resolveLocal(date,time,zone,fold='earlier'){
 const xs=localCandidates(date,time,zone);
 if(!xs.length)throw new Error('この地域では夏時間の切替により、その時刻は存在しません。記録時刻を確認してください。');
 return {ms:fold==='later'?xs.at(-1):xs[0],ambiguous:xs.length>1,offset:offsetAt(fold==='later'?xs.at(-1):xs[0],zone)/3600000};
}
export function nextDate(date){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
export function dayRange(date,zone){
 const start=resolveLocal(date,'00:00',zone).ms,end=resolveLocal(nextDate(date),'00:00',zone).ms;
 if(end<=start)throw new Error('この日付は現地の時刻制度の確認が必要です。');return {start,end};
}
export function today(zone='Asia/Tokyo'){const p=partsAt(Date.now(),zone);return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`;}
