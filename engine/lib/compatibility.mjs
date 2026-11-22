import {validate} from './service.mjs';
import {ephemeris,signOf,LORDS,variableRanges} from './astro.mjs';
import {dayRange} from './time.mjs';
import {SIGNS,PLANETS} from '../public/data.mjs';
// Rao, Vedic Astrology: An Integrated Approach, Table 7, printed p37 (PDF48).
export const NATURAL={sun:{friend:['moon','mars','jupiter'],enemy:['venus','saturn']},moon:{friend:['sun','mercury'],enemy:[]},mars:{friend:['sun','moon','jupiter'],enemy:['mercury']},mercury:{friend:['sun','venus'],enemy:['moon']},jupiter:{friend:['sun','moon','mars'],enemy:['mercury','venus']},venus:{friend:['mercury','saturn'],enemy:['sun','moon']},saturn:{friend:['mercury','venus'],enemy:['sun','moon','mars']}};
export function naturalRelation(a,b){if(!NATURAL[a]||!NATURAL[b])throw new Error('支配星の指定が正しくありません。');return a===b?'same':NATURAL[a].friend.includes(b)?'friend':NATURAL[a].enemy.includes(b)?'enemy':'neutral';}
const words={same:'同じ支配星',friend:'友好',neutral:'中立',enemy:'緊張（伝統分類：敵対）'};
const needs=['まず試せること','自分のペースを守れること','言葉を交わして確かめること','身近な人や場所への安心','自分の考えを尊重されること','手順や役割が分かること','互いの希望を相談できること','理由を深く確かめられること','先の見通しや意味を持てること','約束と役割が明確なこと','自由な距離感や考え方','気持ちを受け取ってもらうこと'];
const asks=['小さく試す機会を一つ作る','急かさず、決める時間を取る','考えていることを短く言葉にする','話を聞いてから次の予定を決める','意見や貢献を具体的に認める','決める順序と担当を整理する','それぞれの希望を一つずつ出す','理由と共有できる範囲を話す','何のためにするかを先に話す','期限と引き受ける範囲を決める','連絡の頻度と一人の時間を相談する','気持ちを聞いた後で提案する'];
const scenes={general:['一緒に何かを決めるとき','日程を決める前に、それぞれの希望と難しい条件を一つずつ話します。'],love:['恋愛の関わり方を考えるとき','会う頻度や連絡のペースについて、お互いが無理なく続けられる形を相談します。交際中かどうかはこの入力から決めません。'],friend:['友人として予定を立てるとき','誘いを断るときの伝え方と、一人で過ごしたいときの連絡の仕方を相談します。'],work:['一緒に仕事を進めるとき','担当・期限・相談するタイミングを文章にし、得意な進め方に合わせて役割を分けます。']};
export function compareSigns(sa,sb,context='general'){
 if(!Number.isInteger(sa)||!Number.isInteger(sb)||sa<0||sb<0||sa>11||sb>11)throw new Error('月の星座を確認してください。');
 const la=LORDS[sa],lb=LORDS[sb],ab=naturalRelation(la,lb),ba=naturalRelation(lb,la);
 let type,title,text;
 if(la===lb){type='same';title='安心の求め方に、共通の土台';text='月の支配星が同じ組合せです。大切にしたいものを話し合う入口を見つけやすいと読みます。同じ支配星でも、月の星座まで同じとは限らず、好みがすべて一致する意味ではありません。';}
 else if(ab==='friend'&&ba==='friend'){type='friendly';title='互いのやり方を受け取りやすい組合せ';text='月の支配星が相互に友好の関係です。相手の考え方を受け止めるきっかけを作りやすいと読みます。言わなくても通じると決めず、希望や負担も言葉にしてください。';}
 else if(ab==='enemy'&&ba==='enemy'){type='tension';title='違いを先に言葉にすると、関わりやすくなる';text='月の支配星は相互に緊張する分類です。大切にする判断の基準がぶつかる可能性を意識し、役割や約束を具体的にすると助けになります。実際に不仲である、関係が続かないという判定ではありません。';}
 else if(ab==='enemy'||ba==='enemy'){type='mixed';title='受け止め方の違いを、確かめながら近づく';text='支配星の関係には緊張する向きがあります。一方が自然だと感じる伝え方を、もう一方は負担に感じることもあると読みます。相手の気持ちを推測せず、伝え方を確かめて調整してください。';}
 else if(ab==='friend'||ba==='friend'){type='open';title='共通点を入口に、少しずつ歩調を合わせる';text='友好と中立が組み合わさります。共感しやすい部分から話しながら、すぐに同じ反応を求めず、相手の考える時間を取ると関わりやすくなります。';}
 else {type='neutral';title='相談しながら、二人のやり方を作る';text='月の支配星は相互に中立です。強い後押しや緊張のどちらかへ決めず、何を大切にしたいかを具体的にすり合わせる組合せとして読みます。';}
 const sameSign=sa===sb;
 return {sa,sb,la,lb,ab,ba,type,title,text,basis:`Aの月は${SIGNS[sa].name}、支配星は${PLANETS[la].name}。Bの月は${SIGNS[sb].name}、支配星は${PLANETS[lb].name}。`,directions:[`Aの支配星 ${PLANETS[la].name} → Bの支配星 ${PLANETS[lb].name}：${words[ab]}`,`Bの支配星 ${PLANETS[lb].name} → Aの支配星 ${PLANETS[la].name}：${words[ba]}`],comfort:sameSign?`二人とも「${needs[sa]}」を安心の入口として読みます。似た反応をしやすい一方、同じ苦手を抱えることもあるため、役割を一人に寄せない工夫が役立ちます。`:`Aは「${needs[sa]}」、Bは「${needs[sb]}」を安心の入口として読みます。相手も自分と同じ方法で落ち着くとは限らない、と考えると違いを相談しやすくなります。`,actions:[`Aに配慮するとき：${asks[sa]}。`,`Bに配慮するとき：${asks[sb]}。`,sameSign?'共通の希望だけでなく、別々にしたいことも一つずつ確認してください。':'同じ場面で二人が望むものを並べ、両方を満たす小さな段取りを一つ試してください。'],example:{heading:scenes[context][0],text:scenes[context][1]+` A向けには「${asks[sa]}」、B向けには「${asks[sb]}」を具体的な一歩にできます。`}};
}
export async function moonProfile(person,label){
 if(!person||typeof person!=='object')throw new Error(`${label}の出生情報を入力してください。`);
 const v=validate({...person,asOf:person.date}),settings={...v.place,ayanamsa:1,node:'mean'};
 const safeName=String(person.name||label).trim().slice(0,24)||label;
 const raw=await ephemeris(v.birth.ms,settings,1,0,false);
 let ranges;
 if(v.accuracy==='exact'){const sign=signOf(raw.samples[0].planets[1].lon);ranges=[{value:sign,start:v.birth.ms,end:v.birth.ms}];}
 else {const range=v.accuracy==='unknown'?dayRange(v.date,v.place.zone):{start:v.birth.ms-v.margin*60000,end:v.birth.ms+v.margin*60000};ranges=await variableRanges(range.start,range.end,settings,s=>signOf(s.planets[1].lon));}
 const candidates=[...new Set(ranges.map(x=>x.value))];
 return {label,name:safeName,date:v.date,time:v.accuracy==='unknown'?null:v.time,accuracy:v.accuracy,margin:v.margin,place:{name:v.place.name,zone:v.place.zone},ambiguous:v.accuracy==='unknown'?false:v.birth.ambiguous,fold:person.fold==='later'?'later':'earlier',candidates,ranges:ranges.map(x=>({sign:x.value,start:x.start,end:x.end})),engine:{version:raw.version,ayanamsa:1,coordinate:'geocentric apparent sidereal',tzdb:process.versions.tz||'system'}};
}
export async function calculateCompatibility(input){
 const context=input?.context||'general';if(!scenes[context])throw new Error('関係の場面を選んでください。');
 const a=await moonProfile(input.a,'Aさん'),b=await moonProfile(input.b,'Bさん');
 const comparisons=a.candidates.flatMap(sa=>b.candidates.map(sb=>compareSigns(sa,sb,context)));
 return {schema:'vedic-pair/1',version:'1.0.0',context,a,b,uncertain:comparisons.length>1,comparisons,method:{name:'月の星座と支配星の自然友好関係（グラハ・マイトリー）',scope:'婚姻照合の一要素を、配点せずに読む限定版です。アシュタクータ全8項目、ナディ、バクータ、マンガル・ドーシャ、D9、周期の一致は判定していません。友人・仕事の具体例は本アプリ独自の活用例です。',sources:[{title:'AIFAS Horoscope Matching：Grah Maitri（本文48〜50頁）',url:'https://www.futuresamachar.com/download/horoscope-matching-325.pdf#page=57'},{title:'Rao：自然友好関係 表7（本文37頁）',url:'https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=48'}]}};
}
