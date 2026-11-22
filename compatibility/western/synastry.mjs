import { readings } from './readings.mjs';

// Five major aspects and their orbs from the approved natal app.
export const aspects = [
  {name:'コンジャンクション', angle:0, orb:8},
  {name:'セクスタイル', angle:60, orb:6},
  {name:'スクエア', angle:90, orb:8},
  {name:'トライン', angle:120, orb:8},
  {name:'オポジション', angle:180, orb:8}
];

export const themes = {
  'Sun/Sun':'二人で何を目指すか',
  'Sun/Moon':'やりたいことと安心できるペース',
  'Sun/Mercury':'目標に向けて相談する力',
  'Sun/Venus':'励ましが伝わる瞬間',
  'Sun/Mars':'決める人と動く人',
  'Moon/Moon':'一緒にいるときの居心地',
  'Moon/Mercury':'気持ちを聞くときの会話',
  'Moon/Venus':'うれしい気遣い',
  'Moon/Mars':'急いでいるときの接し方',
  'Mercury/Mercury':'会話のテンポ',
  'Mercury/Venus':'好意が伝わる言葉',
  'Mercury/Mars':'意見がぶつかったとき',
  'Venus/Venus':'二人が楽しいと思うこと',
  'Venus/Mars':'誘い方と距離の縮め方',
  'Mars/Mars':'一緒に動くときの勢い'
};

export function compareCharts(first,second) {
  const order = ['Sun','Moon','Mercury','Venus','Mars'];
  const matches = [];
  for (const a of first) {
    for (const b of second) {
      const difference = Math.abs(a.longitude - b.longitude) % 360;
      const angle = Math.min(difference, 360 - difference);
      const aspect = aspects.find(item => Math.abs(angle - item.angle) <= item.orb);
      if (!aspect) continue;
      const key = [a.body,b.body].sort((x,y) => order.indexOf(x)-order.indexOf(y)).join('/');
      matches.push({a,b,angle,aspect,offset:Math.abs(angle-aspect.angle),title:themes[key],reading:readings[key][aspects.indexOf(aspect)]});
    }
  }
  return matches.sort((x,y) => x.offset-y.offset);
}
