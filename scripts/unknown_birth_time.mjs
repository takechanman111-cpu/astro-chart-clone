import { swissPositionSeries, normDeg, SIGNS, BODY_JA } from './established_timing_calculator.mjs';

const DAY = 86400000;
const ANGLE_EPS = 0.0001;
const SPEED_EPS = 0.00001;
const delta = (a,b) => ((a-b+540)%360+360)%360-180;
const wrapIndex = (n,count) => ((n%count)+count)%count;
const POINT_JA = {'mean Node':'ノースノード', Chiron:'キロン', 'mean Apogee':'リリス', south_node:'サウスノード'};
const ASPECTS = [
  {name:'コンジャンクション',angle:0,orb:8}, {name:'オポジション',angle:180,orb:8},
  {name:'トライン',angle:120,orb:8}, {name:'スクエア',angle:90,orb:8}, {name:'セクスタイル',angle:60,orb:6}
];

export function localDayInterval(input, timeZone = 'Asia/Tokyo') {
  const format = new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
  const dateKey = time => {
    const parts = Object.fromEntries(format.formatToParts(new Date(time)).map(p=>[p.type,p.value]));
    return +parts.year*10000 + +parts.month*100 + +parts.day;
  };
  const utc = Date.UTC(input.year,input.month-1,input.day);
  const next = new Date(utc+DAY);
  const boundary = key => {
    let lo = (utc-2*DAY)/1000, hi = (utc+3*DAY)/1000;
    while (hi-lo>1) { const mid=Math.floor((lo+hi)/2); if(dateKey(mid*1000)>=key) hi=mid; else lo=mid; }
    return hi*1000;
  };
  const key = input.year*10000+input.month*100+input.day;
  const start=boundary(key), end=boundary(next.getUTCFullYear()*10000+(next.getUTCMonth()+1)*100+next.getUTCDate());
  if(dateKey(start)!==key || end<=start || end-start>26*3600000) throw new Error('出生日の時間帯を確認できませんでした。');
  return {start,end,timeZone};
}

function bins(min,max,width,count) {
  return [...new Set(Array.from({length:Math.floor(max/width)-Math.floor(min/width)+1},(_,i)=>wrapIndex(Math.floor(min/width)+i,count)))];
}

function classification(values,min,max,width,count,verified) {
  const observed=[...new Set(values.map(v=>wrapIndex(Math.floor(v/width),count)))];
  const possible=bins(min-ANGLE_EPS,max+ANGLE_EPS,width,count);
  return {status:observed.length>1?'conditional':verified&&possible.length===1?'common':'unresolved', candidates:possible};
}

// A same-sign sample triple can still bend toward zero between its sample times.
export function possibleHiddenTurn(v0,vm,v1) {
  if(Math.min(Math.abs(v0),Math.abs(vm),Math.abs(v1))<=SPEED_EPS) return true;
  if(!(v0*vm>0 && vm*v1>0)) return false;
  const a=2*(v0+v1-2*vm), b=4*vm-3*v0-v1;
  if(Math.abs(a)<1e-15) return false;
  const t=-b/(2*a);
  if(t<=0 || t>=1) return false;
  const value=a*t*t+b*t+v0;
  return v0>0 ? value<=SPEED_EPS : value>=-SPEED_EPS;
}

export function calculateUnknownBirthTime(input, options={}) {
  const interval=localDayInterval(input);
  const count=Math.ceil((interval.end-interval.start)/150000)+1;
  const step=(interval.end-interval.start)/(count-1)/1000;
  const series=options.series || swissPositionSeries;
  const grid=series(new Date(interval.start),count,step);
  const cache=new Map(grid.map(s=>[s.time,s]));
  let evaluations=0;
  const at=time=>{
    time=Math.round(time/1000)*1000;
    if(!cache.has(time)) {
      if(++evaluations>2000) throw new Error('時間幅の検証上限に達しました。結果は確定していません。');
      cache.set(time,series(new Date(time),1)[0]);
    }
    return cache.get(time);
  };
  const events=[];
  const root=(a,b,fn,type,body)=>{
    let fa=fn(at(a));
    const fb=fn(at(b));
    if(fa===0 && fb===0) return;
    if(fa*fb>0) return;
    while(b-a>1000) {
      const mid=Math.floor((a+b)/2000)*1000;
      const fm=fn(at(mid));
      if(fa*fm<=0) b=mid; else { a=mid; fa=fm; }
    }
    events.push({type,body,from_utc:new Date(a).toISOString(),to_utc:new Date(b).toISOString()});
    at(a); at(b);
  };
  const quality=grid[0].rows.map(()=>true);
  const pairQuality=Array.from({length:10},()=>Array(10).fill(true));
  // The intermediate measured position must agree with the velocity-aware interpolation.
  for(let k=0;k+2<grid.length;k+=2) for(let i=0;i<quality.length;i++) {
    const a=grid[k].rows[i], m=grid[k+1].rows[i], b=grid[k+2].rows[i];
    const days=(grid[k+2].time-grid[k].time)/DAY;
    const predicted=a.longitude+delta(b.longitude,a.longitude)/2+days*(a.speed-b.speed)/8;
    if(Math.abs(delta(m.longitude,predicted))>ANGLE_EPS) quality[i]=false;
    if(possibleHiddenTurn(a.speed,m.speed,b.speed)) quality[i]=false;
  }
  for(let k=0;k+2<grid.length;k+=2) for(let i=0;i<10;i++) for(let j=i+1;j<10;j++) {
    const speeds=[grid[k],grid[k+1],grid[k+2]].map(s=>s.rows[i].speed-s.rows[j].speed);
    if(possibleHiddenTurn(...speeds)) pairQuality[i][j]=false;
  }
  for(let k=0;k<grid.length-1;k++) {
    const a=grid[k], b=grid[k+1];
    for(let i=0;i<quality.length;i++) {
      const p=a.rows[i], q=b.rows[i];
      if(p.speed*q.speed<0) root(a.time,b.time,s=>s.rows[i].speed,'station',p.body);
      const lo=p.longitude, hi=lo+delta(q.longitude,lo);
      for(let degree=Math.ceil(Math.min(lo,hi));degree<=Math.max(lo,hi);degree++) {
        root(a.time,b.time,s=>lo+delta(s.rows[i].longitude,lo)-degree,
          degree%30===0?'sign':'sabian',p.body);
      }
    }
    for(let i=0;i<10;i++) for(let j=i+1;j<10;j++) {
      const speed=s=>s.rows[i].speed-s.rows[j].speed;
      if(speed(a)*speed(b)<0) root(a.time,b.time,speed,'relative_station',`${a.rows[i].body}/${a.rows[j].body}`);
      const lo=delta(a.rows[i].longitude,a.rows[j].longitude);
      const hi=lo+delta(delta(b.rows[i].longitude,b.rows[j].longitude),lo);
      for(const asp of ASPECTS) for(const sign of [-1,1]) for(const side of [-1,1]) {
        let bound=sign*asp.angle+side*asp.orb;
        bound=lo+delta(bound,lo);
        if(bound<Math.min(lo,hi)||bound>Math.max(lo,hi)) continue;
        root(a.time,b.time,s=>lo+delta(delta(s.rows[i].longitude,s.rows[j].longitude),lo)-bound,
          'aspect',`${a.rows[i].body}/${a.rows[j].body}/${asp.name}`);
      }
    }
  }
  const samples=[...cache.values()].sort((a,b)=>a.time-b.time);
  const interior=samples.filter(s=>s.time<interval.end);
  const middle=at((interval.start+interval.end)/2);
  const results=grid[0].rows.map((row,i)=>{
    const anchor=row.longitude;
    const vals=samples.map(s=>anchor+delta(s.rows[i].longitude,anchor));
    const speeds=samples.map(s=>s.rows[i].speed);
    const min=Math.min(...vals), max=Math.max(...vals);
    const observed=interior.map(s=>anchor+delta(s.rows[i].longitude,anchor));
    const sign=classification(observed,min,max,30,12,quality[i]);
    const sabian=classification(observed,min,max,1,360,quality[i]);
    const minSpeed=Math.min(...speeds), maxSpeed=Math.max(...speeds);
    const motion=minSpeed < -SPEED_EPS && maxSpeed>SPEED_EPS?'conditional'
      :quality[i]&&(minSpeed>SPEED_EPS||maxSpeed < -SPEED_EPS)?'common':'unresolved';
    return {body:row.body,name:BODY_JA[row.body]||POINT_JA[row.body],
      reference_longitude:middle.rows[i].longitude, min_longitude:min,max_longitude:max,
      sign, sabian, motion:{status:motion,value:motion==='common'?(minSpeed>0?'direct':'retrograde'):null},
      numerical_verified:quality[i]};
  });
  const node=results[10];
  const south={...node,body:'south_node',name:POINT_JA.south_node,
    reference_longitude:normDeg(node.reference_longitude+180), min_longitude:node.min_longitude+180,max_longitude:node.max_longitude+180,
    sign:{...node.sign,candidates:node.sign.candidates.map(s=>(s+6)%12)},
    sabian:{...node.sabian,candidates:node.sabian.candidates.map(s=>(s+180)%360)}};
  const aspects=[];
  for(let i=0;i<10;i++) for(let j=i+1;j<10;j++) {
    const distances=samples.map(s=>Math.abs(delta(s.rows[i].longitude,s.rows[j].longitude)));
    // Relative extrema were sampled above. Include a fold at zero/180 between samples.
    let low=Math.min(...distances), high=Math.max(...distances);
    for(let k=1;k<samples.length;k++) {
      const x=delta(samples[k-1].rows[i].longitude,samples[k-1].rows[j].longitude);
      const y=delta(samples[k].rows[i].longitude,samples[k].rows[j].longitude);
      if(x*y<0) { if(Math.abs(x-y)>180) high=180; else low=0; }
    }
    for(const asp of ASPECTS) {
      const min=low<=asp.angle&&high>=asp.angle?0:Math.min(Math.abs(low-asp.angle),Math.abs(high-asp.angle));
      const max=Math.max(Math.abs(low-asp.angle),Math.abs(high-asp.angle));
      if(min>asp.orb+2*ANGLE_EPS) continue;
      aspects.push({first:results[i].name,second:results[j].name,...asp,min_orb:min,max_orb:max,
        status:quality[i]&&quality[j]&&pairQuality[i][j]&&max<asp.orb-2*ANGLE_EPS?'common'
          :min<asp.orb-2*ANGLE_EPS&&max>asp.orb+2*ANGLE_EPS?'conditional':'unresolved'});
    }
  }
  const groups=[{name:'エレメント',labels:['火','地','風','水'],mod:4},
    {name:'クオリティ',labels:['活動宮','不動宮','柔軟宮'],mod:3},
    {name:'極性',labels:['男性星座','女性星座'],mod:2}];
  const balance=groups.map(g=>({name:g.name,status:results.slice(0,10).every(r=>r.sign.status==='common')?'common':'unresolved',
    items:g.labels.map((label,index)=>{
      const counts=interior.map(s=>s.rows.slice(0,10).filter(r=>Math.floor(r.longitude/30)%g.mod===index).length);
      return {label,min:Math.min(...counts),max:Math.max(...counts)};
    })}));
  return {schema:'unknown-birth-time/v1',engine_id:'swetest_cli',calculation_policy:'swiss_ephemeris_swetest_only',
    input:{...input,hour:null,minute:null,second:null,birthTimeUnknown:true},
    interval:{start_utc:new Date(interval.start).toISOString(),end_utc_exclusive:new Date(interval.end).toISOString(),time_zone:interval.timeZone},
    reference_time_utc:new Date(middle.time).toISOString(),
    planets:results.slice(0,10),points:[node,south,results[11],results[12]],aspects,balance,events,
    verification:{method:'sampled_positions_and_speeds_with_bracketed_event_refinement',sample_count:cache.size,
      max_step_seconds:step,root_time_tolerance_seconds:1,angular_tolerance_degrees:ANGLE_EPS,speed_tolerance_degrees_per_day:SPEED_EPS,
      mathematical_interval_proof:false},
    unavailable:['ASC','MC','ハウス','ハウス支配星','チャートルーラー','半球分布','時期読み'],
    note:'全日を2.5分以下で調べ、検出した境界と留を1秒幅まで追跡する数値検証です。数学的な区間保証ではありません。境界付近や検証不足の項目は未確定です。'};
}
