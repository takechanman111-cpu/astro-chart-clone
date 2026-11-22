import {SIGNS,PLANETS,HOUSES,NAKS,DIGNITY,DIGNITY_TEXT} from '../public/data.mjs';
import {LORDS,dignity,aspects,navamsaOf} from './astro.mjs';
export const sources={core:'Rao, Vedic Astrology: An Integrated Approach：星・星座・室・惑星アスペクト・分割図・ヴィムショッタリの各章',nak:'27宿の象徴を基にした、このアプリ独自の初心者向け日本語編集。宿名だけで人格や出来事を断定しません。'};
export function ruledHouses(key,lagna){return lagna===null?[]:LORDS.flatMap((x,i)=>x===key?[(i-lagna+12)%12+1]:[]).sort((a,b)=>a-b);}
const joinHs=xs=>xs.map(h=>`${h}室（${HOUSES[h-1].name}）`).join('・');
export function planetReading(p,chart){
 const P=PLANETS[p.key],S=SIGNS[p.sign],H=p.house?HOUSES[p.house-1]:null,ruled=ruledHouses(p.key,chart.lagna),d=dignity(p),a=aspects(chart.planets).filter(a=>a.to===p.key);
 const lines=[{label:'この配置で分かること',text:`${P.name}からは、${P.role}を読みます。${S.name}にあるため、${S.style}やり方が表れやすくなります。`},{label:'強みと使いどころ',text:`${P.ability}を、${S.quality}と組み合わせて使う配置です。${H?`特に${H.topic}の場面に意識が向きやすく、${H.example}ことが力の使いどころになります。`:S.strength}`},{label:'つまずきやすいところ',text:`${P.risk}ことに注意してください。${S.weak} ${H?`この分野では、${H.care}ことが大切です。`:''}`},{label:'生かし方',text:`${P.action}ことから始めてください。${S.action}`}];
 if(!['normal','node'].includes(d))lines.push({label:`星座との関係：${DIGNITY[d]}`,text:DIGNITY_TEXT[d]});
 if(p.retro&&!['rahu','ketu'].includes(p.key))lines.push({label:'逆行について',text:`出生時の${P.name}は逆行しています。地球から見た動きのことで、能力が劣るという意味ではありません。この版では逆行だけで説明や吉凶を反転させません。`});
 const basis=[`${P.name}：${S.name} ${p.degree.toFixed(4)}度`,H?`在住：${p.house}室（${H.name}）`:'出生時刻不明のため室は判定しません',ruled.length?`支配：${joinHs(ruled)}`:null,a.length?`受ける惑星アスペクト：${a.map(x=>PLANETS[x.from].name).join('・')}`:null].filter(Boolean);
 return {key:p.key,visual:{sign:p.sign,topic:p.key,caption:`${P.name}：${S.name}`},title:`${P.name}｜${P.role}`,subtitle:`${S.name}${H?`・${p.house}室`:''}`,paragraphs:lines,basis,source:'core'};
}
export function natalReading(chart,stableKeys=null){
 const allowed=p=>!stableKeys||stableKeys.includes(p.key),ps=chart.planets.filter(allowed),asc=chart.lagna===null?null:SIGNS[chart.lagna],moon=ps.find(p=>p.key==='moon'),sun=ps.find(p=>p.key==='sun');
 const blocks=[];
 if(asc){const ruler=chart.planets.find(p=>p.key===LORDS[chart.lagna]);blocks.push({key:'asc',visual:{sign:chart.lagna,topic:'lagna',caption:`ラグナ：${asc.name}`},title:'あなたの基本の資質',subtitle:`ラグナ（生まれた瞬間の東の地平線）：${asc.name}`,paragraphs:[{label:asc.title,text:`${asc.quality}が、物事への取りかかり方に表れやすい配置です。${asc.strength}`},{label:'強みが働く場面',text:`${asc.work}のように、自分の持ち味を使える役割を探してください。さらに、${asc.name}の支配星である${PLANETS[ruler.key].name}は${ruler.house}室にあるため、${HOUSES[ruler.house-1].topic}も、自分らしい力を育てる大切な分野になります。`},{label:'苦手になりやすいこと',text:asc.weak},{label:'日常で生かすなら',text:asc.action}],basis:[`ラグナ：${asc.name}`,`ラグナ支配星：${PLANETS[ruler.key].name}／${SIGNS[ruler.sign].name}／${ruler.house}室`],source:'core'});}
 if(moon){const s=SIGNS[moon.sign];blocks.push({key:'mind',visual:{sign:moon.sign,topic:'moon',caption:`月：${s.name}`},title:'心が落ち着く条件と、感情の動き',subtitle:`月：${s.name}`,paragraphs:[{label:'あなたの心の傾向',text:s.moon},{label:'心の持ち味',text:`${s.quality}は、人との付き合い方にも表れます。${s.relation}ことを意識すると、持ち味を生かしながら関係を育てられます。`},{label:'疲れたときの整え方',text:`${s.weak} ${s.action}`}],basis:[`月：${s.name}${moon.house?`／${moon.house}室`:''}`],source:'core'});}
 if(sun){const s=SIGNS[sun.sign];blocks.push({key:'sun',visual:{sign:sun.sign,topic:'sun',caption:`太陽：${s.name}`},title:'意思の示し方と、責任の持ち方',subtitle:`太陽：${s.name}`,paragraphs:[{label:'自分の考えを形にする力',text:`${s.style}ことを通じて、自分が大切にする考えを周囲へ示す配置です。${s.strength}`},{label:'無理を増やさないために',text:`${s.weak} ${s.action}`}],basis:[`太陽：${s.name}${sun.house?`／${sun.house}室`:''}`],source:'core'});}
 const strong=ps.filter(p=>!['rahu','ketu'].includes(p.key)).sort((a,b)=>({exalted:3,own:2,normal:1,debilitated:0}[dignity(b)]-({exalted:3,own:2,normal:1,debilitated:0}[dignity(a)]))).slice(0,3);
 const strengths=strong.map(p=>({key:p.key,visual:{sign:p.sign,topic:p.key,caption:`${PLANETS[p.key].name}：${SIGNS[p.sign].name}`},title:PLANETS[p.key].ability,text:`${SIGNS[p.sign].style}ことが、${p.house?HOUSES[p.house-1].topic:'日々の選択'}で役立ちます。${SIGNS[p.sign].action}`,basis:`${PLANETS[p.key].name}：${SIGNS[p.sign].name}${p.house?`・${p.house}室`:''}${['own','exalted'].includes(dignity(p))?`・${DIGNITY[dignity(p)]}`:''}`}));
 let nak=null;if(moon&&!stableKeys){const n=NAKS[moon.nak.index];nak={key:'nak',visual:{sign:moon.sign,topic:'nakshatra',caption:`月：${SIGNS[moon.sign].name}／${n[0]}`},title:`月のナクシャトラ：${n[0]}`,subtitle:`${n[1]}／第${moon.nak.pada}パーダ`,paragraphs:[{label:'内面に表れやすい特徴',text:n[2]},{label:'持ち味を育てる行動',text:n[3]+'ことを意識してください。'},{label:'ナクシャトラとは',text:'月がどの位置にあったかを、黄道を27等分した区分で詳しく見る方法です。第1〜4パーダは、その一つをさらに四つに分けた位置です。この版ではパーダ番号だけから性格を付け足しません。'}],basis:[`月の黄経：${moon.lon.toFixed(6)}度`,`第${moon.nak.index+1}宿・第${moon.nak.pada}パーダ`],source:'nak'};}
 return {blocks,strengths,nak,planets:ps.map(p=>planetReading(p,chart))};
}
export function periodReading(maha,antar,chart){
 const M=PLANETS[maha.key],A=PLANETS[antar.key],m=chart.planets.find(p=>p.key===maha.key),a=chart.planets.find(p=>p.key===antar.key);
 const house=HOUSES[a.house-1],ruled=ruledHouses(a.key,chart.lagna),d=dignity(a),supported=['own','exalted'].includes(d),effort=d==='debilitated'||[6,8,12].includes(a.house),both=effort&&supported;
 const titles=['自分の選び方を見直し、行動に移す時期','お金と暮らしの基盤を整える時期','伝えることや練習を、形にしていく時期','住まいや身近な関係を、落ち着く形に整える時期','学びや創作を、自分の形で育てる時期','日々の仕事量を調整し、負担を減らす時期','相手との約束や協力の仕方を育てる時期','共有するお金や役割を、丁寧に見直す時期','学びを深め、進む方向を考える時期','仕事の進め方を整え、実績につなげる時期','仲間との協力を、具体的な成果につなげる時期','休息を取り、予定や支出を整理する時期'];
 const assessment=titles[a.house-1];
 const status=both?'調整と発揮':effort?'整える':supported?'生かす':'育てる';
 const aspectsTo=aspects(chart.planets).filter(x=>x.to===a.key).map(x=>PLANETS[x.from].name);
 const paras=[
  {label:'この期間の流れ',text:maha.key===antar.key?`大周期と小周期がともに${M.name}の期間です。${M.period} あなたの出生図では${M.name}が${a.house}室にあるため、特に${house.topic}に、このテーマを結びつけて読みます。`:`大きな流れは、${M.theme}ことです。その中で${A.name}の小周期が重なる今は、${A.theme}ことに力を使う期間です。出生図の${A.name}は${a.house}室にあり、具体的には${house.topic}が取り組みの対象になります。`},
  {label:'追い風になること',text:`${A.ability}を、${SIGNS[a.sign].style}やり方で生かしてください。具体的には、${house.good}ことが、今のテーマに合う行動です。${supported?DIGNITY_TEXT[d]:'生まれ持った傾向を日々の行動へつなげることで、取り組む対象を選びやすくなります。'}`},
  {label:'気をつけたいこと',text:`${A.risk}と、本来の良さを使いにくくなります。${house.care}ことを意識してください。${d==='debilitated'?'この星座では星の働きに工夫が必要とされるため、段取りや人の助けを用意して進めてください。':''}`},
  {label:'今からできること',text:`${house.example}ことから始めてください。${SIGNS[a.sign].action}`}
 ];
 if(ruled.length)paras.push({label:'関連するテーマ',text:`${A.name}は出生図で${joinHs(ruled)}を支配しています。ここでいう支配星は、その分野の様子を読むために確認する星です。${house.topic}への取り組みと、${ruled.map(h=>HOUSES[h-1].name).join('、')}とのつながりも合わせて考えてください。`});
 if(['rahu','ketu'].includes(a.key)){const disp=chart.planets.find(p=>p.key===LORDS[a.sign]);paras.push({label:'交点の期間を補う配置',text:`${A.name}がいる${SIGNS[a.sign].name}の支配星は${PLANETS[disp.key].name}で、出生図の${disp.house}室にあります。交点の意味だけで判断せず、${HOUSES[disp.house-1].topic}も合わせて確かめる期間です。`});}
 if(aspectsTo.length)paras.push({label:'他の星との関係',text:`小周期の${A.name}には、出生図で${aspectsTo.join('・')}から惑星アスペクトがあります。${aspectsTo.map(name=>Object.values(PLANETS).find(p=>p.name===name).ability).join('、')}も、この星の働きを補う性質として読みます。関係があることだけで、出来事の成功や失敗を決めるものではありません。`});
 return {visual:{sign:a.sign,topic:'dasha',planet:a.key,caption:`小周期の${A.name}：${SIGNS[a.sign].name}`},title:assessment,status,theme:house.name,maha:maha.key,antar:antar.key,start:antar.start,end:antar.end,paragraphs:paras,basis:[`大周期：${M.name}／出生図${m.house}室`,`小周期：${A.name}／${SIGNS[a.sign].name}／出生図${a.house}室`,ruled.length?`小周期の星が支配する室：${ruled.join('・')}室`: '交点のため星座の支配は割り当てません',`小周期の星座上の状態：${DIGNITY[d]}`,aspectsTo.length?`小周期の星が受ける関係：${aspectsTo.join('・')}の惑星アスペクト`:null].filter(Boolean),source:'core'};
}
export function lifeAreas(chart){
 const links={work:[
 '自分の判断が仕事の進め方に反映されやすい配置です。任される範囲を確認し、自分から提案できる役割を選ぶと持ち味を使いやすくなります。',
 '仕事と収入、言葉の使い方が結びつきます。自分の技術を何に役立てられるか説明し、報酬や費用の条件を具体的にすることが大切です。',
 '発信、練習、小さな挑戦が仕事に結びつきます。実績を伝える文章や説明を磨き、学んだことを繰り返し使ってください。',
 '仕事と、住まいや生活の土台が結びつきます。集中できる仕事場や続けやすい働き方を整えることが、能力を安定して使う助けになります。',
 '学びや創作を、仕事へ育てやすい組合せです。得た知識やアイデアを作品、教材、提案などの形にして届けることを考えてください。',
 '日々の実務や問題解決が、仕事の中心になりやすい組合せです。頼まれるまま仕事量を増やさず、役割分担と手順を整えることが大切です。',
 '顧客や協力相手との一対一の関係が仕事に結びつきます。相手の希望を聞くことと、提供する範囲を明確にすることを両立してください。',
 '調査、変更、引き継ぎなど、表に出にくい事情を丁寧に扱う力が仕事に結びつきます。複雑な条件は文書にし、責任を曖昧にしないことが大切です。',
 '専門の学びや助言者とのつながりが、仕事の方向に結びつきます。学ぶだけで終えず、現場で何に使えるかまで確かめてください。',
 '仕事の役割や成果そのものに意識が向きやすい配置です。自分が担当する範囲と、評価してほしい成果を具体的にすることが役立ちます。',
 '仲間や組織との協力が仕事の成果につながります。知り合いを増やすだけでなく、互いの得意なことと担当を決めて取り組んでください。',
 '遠方とのやりとり、裏方の作業、一人で集中する時間が仕事と結びつきます。見えにくい作業時間と費用を把握し、休息まで含めて計画してください。'
 ],money:[
 'お金の使い方が、自分自身の選択や活動と結びつきます。自分の力を育てる費用と、目先の気分による支出を分けて把握してください。',
 '収入や持ち物を大切に管理することが、この分野の中心になります。日々の収支と、長く守りたい生活の条件を一緒に確認してください。',
 '練習や発信、身近な活動がお金と結びつきます。身につけた技術を何に使えるかを考え、小さな実践を積み重ねてください。',
 '住まいや家族、生活の土台とお金が結びつきます。住居費や家族との分担を見える形にし、安心のために必要な費用を把握してください。',
 '学びや楽しみ、創作への支出が気になりやすい組合せです。使う予算を決め、何に役立ったかまで振り返ってください。投機的な利益の保証ではありません。',
 '日々の仕事と収入、継続する支出が結びつきます。忙しさだけで判断せず、使う時間と得られる対価を具体的に確かめてください。',
 '協力相手や契約の条件がお金に結びつきます。好意と金銭条件を分け、報酬、支払い、責任を事前に確かめてください。',
 '共同のお金や引き継ぐ責任が、この分野に関わります。名義、支払い、管理の条件を曖昧にせず、必要な書類を確認してください。',
 '専門の学びや遠方との関係がお金に結びつきます。将来への学習費と生活費を分け、学びに使う予算を具体的に決めてください。',
 '仕事の役割や実績と収支が結びつきます。自分が提供した内容を整理し、報酬や条件を説明できる形にしておくことが役立ちます。',
 '仲間との活動や目標の達成が収支と結びつきます。期待する金額だけでなく、費用や分配の条件も確認して協力してください。',
 '見えにくい出費や遠方への支払いが関わりやすい配置です。固定費、少額の継続支払い、人のための支出を一度まとめて確認してください。'
 ],relationships:[
 '関係の中で自分の意見や存在をどう表すかが大切になります。相手に合わせるだけでなく、自分が希望する関係も伝えてください。',
 '言葉や生活の価値観が、関係の安心につながります。お金の使い方や日々の約束を、互いに納得できる形で話してください。',
 '日々の会話や一緒に取り組むことが、関係を育てます。用事だけでなく、考えていることを短く共有する機会をつくってください。',
 '一緒に過ごす場所や生活の居心地が、関係と結びつきます。自分が休める時間と、相手と過ごす時間を両方確保してください。',
 '共通の楽しみや学びが関係の接点になります。趣味や創作を分かち合いながら、好みの違いまで無理に揃えないでください。',
 '役割分担や日々の用事の調整が、関係の課題になりやすい組合せです。どちらか一方が抱え込まないよう、負担を具体的に話してください。',
 '相手との協力や約束が、関係の中心になります。察することに頼らず、今後どのように付き合いたいかを確かめ合ってください。',
 '深い信頼や共有する責任が、関係と結びつきます。距離を縮めるほど、お金や役割の条件を曖昧にしないことが大切です。',
 '考え方や学び、生き方への理解が、関係を育てる接点になります。自分の信じることを説明するとともに、相手の経験も聞いてください。',
 '仕事や社会での役割が、関係に影響しやすい組合せです。忙しい時期ほど、予定と優先したい時間を具体的に共有してください。',
 '仲間としての信頼や共通の希望が、関係を育てます。一緒に何をしたいかを話し、互いが協力できることを見つけてください。',
 '一人の時間や距離の取り方が、関係の居心地に関わります。静かに過ごしたい理由や連絡の希望を伝え、相手に推測させすぎないでください。'
 ]};
 return [{key:'work',title:'仕事で力を発揮するには',h:10,extra:[2,6,11]},{key:'money',title:'お金との付き合い方',h:2,extra:[11]},{key:'relationships',title:'人間関係・パートナーシップ',h:7,extra:[4,11]}].map(x=>{
  const sign=(chart.lagna+x.h-1)%12,lord=LORDS[sign],p=chart.planets.find(p=>p.key===lord),S=SIGNS[p.sign],P=PLANETS[lord],H=HOUSES[p.house-1],occupants=chart.planets.filter(p=>p.house===x.h);
  const opening=x.key==='work'?`仕事の進め方では、${S.work}のような、自分の工夫を使える役割が候補になります。`:x.key==='money'?`収支を整えるうえでは、${S.money}ことが実際の工夫になります。`:`人との付き合いでは、${S.relation}ことが関係を育てる助けになります。`;
  return {key:x.key,visual:{sign:p.sign,topic:p.key,caption:`支配星・${P.name}：${S.name}`},title:x.title,subtitle:`${x.h}室と、その支配星の配置から`,paragraphs:[{label:'あなたに合う取り組み方',text:opening},{label:'今回の配置が示すつながり',text:`この分野の支配星である${P.name}は、${S.name}の${p.house}室にあります。${links[x.key][p.house-1]}`},{label:'強みを使うには',text:`${P.ability}と、${S.quality}を生かしてください。${S.strength}`},{label:'注意と具体的な工夫',text:`${S.weak} ${S.action}`}],basis:[`${x.h}室：${SIGNS[sign].name}`,`支配星：${P.name}／${S.name}／${p.house}室`,occupants.length?`在住する星：${occupants.map(p=>PLANETS[p.key].name).join('・')}`:'この室に主要な星がなくても、支配星から読みます。'],source:'core'};
 });
}
export function transitReading(transit,natal){
 const moon=natal.planets.find(p=>p.key==='moon');
 return ['jupiter','saturn'].map(key=>{
  const p=transit.planets.find(p=>p.key===key),fromAsc=(p.sign-natal.lagna+12)%12+1,fromMoon=(p.sign-moon.sign+12)%12+1,H=HOUSES[fromAsc-1],P=PLANETS[key],good=(key==='jupiter'?[2,5,7,9,11]:[3,6,11]).includes(fromMoon);
  return {key,visual:{sign:p.sign,topic:p.key,caption:`今の${P.name}：${SIGNS[p.sign].name}`},title:`今の${P.name}の動き`,subtitle:`${SIGNS[p.sign].name}／出生ラグナから${fromAsc}室`,paragraphs:[{label:'現在、意識したい分野',text:key==='jupiter'?`${H.topic}について、学びや選択肢を広げるきっかけを探す配置です。${H.good}ことを具体的な計画につなげてください。`:`${H.topic}について、負担と継続の仕方を見直す配置です。${H.care}ことが、無理なく続けるための取り組みになります。`},{label:'出生時の月から見た補足',text:`今の${P.name}は、生まれたときの月から数えて${fromMoon}番目です。${good?'伝統的な月基準の読みでは、取り組みを後押ししやすい位置に含まれます。':'この版の月基準の読みでは、単純な追い風とはせず、準備や状況確認を合わせて進める位置として扱います。'} この補足だけで運勢全体は決めず、上の大周期・小周期と区別して読みます。`}],basis:[`基準日時の${P.name}：${SIGNS[p.sign].name}`,`出生ラグナ基準：${fromAsc}室／出生月基準：${fromMoon}番目`],source:'core'};
 });
}
export function d9Reading(chart){
 return chart.planets.map(p=>{
  const q={...p,sign:p.d9},d=dignity(q),same=p.sign===p.d9,S=SIGNS[p.d9];
  return {key:p.key,visual:{sign:p.d9,topic:'navamsa',caption:`D9の${PLANETS[p.key].name}：${S.name}`},title:PLANETS[p.key].name,sign:p.d9,same,dignity:d,text:`${PLANETS[p.key].role}を細かく見ると、D9では${S.style}傾向が補足されます。${same?'出生図とD9で同じ星座にある「ヴァルゴッタマ」です。二つの図で同じ性質が繰り返される配置として読みます。':`出生図の${SIGNS[p.sign].name}の特徴と、D9の${S.name}の特徴を合わせて読みます。`}${['exalted','own','debilitated'].includes(d)?DIGNITY_TEXT[d]:''}`,basis:`D1：${SIGNS[p.sign].name} → D9：${S.name}`};
 });
}
