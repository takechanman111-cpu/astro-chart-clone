// These readings consume calculated positions. Dates are observation dates, not event predictions.
const TIMING_ACTIONS={
1:['自分で始めたいことを一つ選ぶ','参加したい場に連絡する、自己紹介を書き直すなど、相手の返事を待たずにできる一歩から始めましょう。','予定を増やす前に、続ける時間を確保すること'],
2:['お金の使い道と、得意なことの育て方を整える','今月の固定費と自由に使えるお金を分け、伸ばしたい技能に使う時間や予算を決めましょう。','売上や持ち物の多さで、自分の価値まで判断しないこと'],
3:['学んだことを、人に伝わる形にする','覚えたことを短い記事にする、相手に説明して質問をもらうなど、情報を受け取るだけで終わらせない工夫が役立ちます。','連絡や情報収集で、集中する時間がなくならないようにすること'],
4:['家で落ち着ける時間と場所を作る','気になる場所を一か所片付ける、家事の分担を話すなど、毎日の負担を一つ減らしてみましょう。','家族の都合だけで、自分の予定を埋めないこと'],
5:['好きなことを、作品や楽しい予定にする','作りかけのものを一つ完成させる、会いたい人を誘うなど、楽しみを予定に入れましょう。','人の反応を気にして、楽しみまで義務にしないこと'],
6:['仕事の段取りと休み方を整える','繰り返す作業を一つ減らし、仕事を終える時間を先に決めましょう。','頼まれるたびに、今ある仕事へ上乗せしないこと'],
7:['相手との約束や担当を、言葉で確認する','一緒に進める相手と、何をどちらが担当するか、いつまでにするかを話しましょう。','相手に合わせ続けて、不満をためないこと'],
8:['共有しているお金や負担を確認する','共同の支出や契約、引き継ぐ仕事を一覧にして、お互いの認識を確かめましょう。','信頼しているからと、大切な条件の確認を省かないこと'],
9:['学ぶ分野を決め、普段と違う考えに触れる','興味のある講座や本を一つ選び、学んだことを今の仕事で試してみましょう。','遠い目標だけを考えて、今日の作業を後回しにしないこと'],
10:['仕事で残したい成果を一つ決める','担当する仕事と期限を整理し、何ができたら完了かを一緒に働く人と共有しましょう。','評価を得るために、引き受ける責任を増やしすぎないこと'],
11:['仲間と、小さな企画を動かす','同じ関心の人に声をかけ、勉強会や共同制作など、終わりの見える企画を一つ始めてみましょう。','交流の予定だけで、自分の活動の時間がなくならないようにすること'],
12:['未完了のことを整理し、一人で休む時間を取る','やめる用事を一つ決め、通知を見ずに過ごす時間や、表に出す前の制作時間を確保しましょう。','困ったことまで一人で抱え込まないこと']
};
const TRANSIT_APPROACH={
Jupiter:['試してみる範囲を広げたい時期','興味があって保留していたことを、小さな規模で一度試しましょう。','期待だけで予定や出費を増やしすぎないこと'],
Saturn:['続けられる形へ立て直したい時期','無理が続いている約束を一つ選び、期限や担当、作業量を調整しましょう。','できていない部分ばかりを数えて、自分を追い込まないこと'],
Uranus:['合わなくなったやり方を変えたい時期','今の方法を残しながら、別の方法を一つ試し、使いやすさを比べましょう。','変えたい勢いだけで、必要な約束まで投げ出さないこと'],
Neptune:['願っていることと、実際の条件を確かめたい時期','期待していることを書き出し、相手と確認できたこと、まだ想像の部分を分けましょう。','曖昧な返事を、自分の望む約束として受け取らないこと'],
Pluto:['繰り返す問題に、腰を据えて向き合いたい時期','何度も困っていることを一つ選び、自分だけで変えられない条件は関係者と話しましょう。','すべてを自分の思いどおりに管理しようとしないこと']
};
const NATAL_TIMING_TARGET={Sun:['目標や仕事の進め方','今いちばん続けたい目標を一つ書き、他の予定をそのために調整する'],Moon:['休み方や、身近な人との過ごし方','気疲れする予定を一つ減らし、落ち着ける人や場所で過ごす'],Mercury:['連絡、学び、説明の仕方','大切な連絡を文章にまとめ、期限と内容を相手と確認する'],Venus:['人付き合い、楽しみ、お金の使い方','会いたい人と使える予算を選び、自分が楽しめる時間を残す'],Mars:['行動の速さや、意思表示','急いで返事をする前に、自分が引き受けられる量を伝える'],Jupiter:['学びや、活動を広げる計画','広げたいことを一つに絞り、試すための時間と予算を決める'],Saturn:['責任や、長く続ける仕事','一人で背負っている担当を整理し、任せられる仕事を相談する'],Uranus:['新しい方法への切り替え','変更を一度に進めず、試す期間を決めて比べる'],Neptune:['理想や、周囲への期待','願っていることと、実際に確認できた条件を分ける'],Pluto:['譲れないことや、根本から変えたい問題','今の負担を具体的に伝え、変えられる条件を一つずつ相談する']};
function timingAspectParagraph(a,houses){
  const target=NATAL_TIMING_TARGET[a.natal_body],approach=TRANSIT_APPROACH[a.transit_body];
  const tense=['□','☍'].includes(a.symbol),combined=a.symbol==='☌';
  const transitAction=approach?approach[1]:({Sun:'今優先したいことを決めましょう。',Mercury:'話す・書く・確認する時間を取りましょう。',Venus:'人と会う予定や楽しみに時間を使いましょう。',Mars:'短く終えられる作業から着手しましょう。'}[a.transit_body]||'今できる作業を一つ選びましょう。');
  return `<b>${tense?'調整したいこと':combined?'意識を向けたいこと':'生かしたいこと'}：${target[0]}。</b>${approach?`今の${a.transit_body_ja}は、${approach[0]}です。`:''}${tense?(approach?`注意したいのは、${approach[2]}です。`:'予定を詰めすぎたり、返事を急いだりしないよう、作業量を確かめましょう。'):combined?'この分野に意識が集まりやすい配置です。':'いつものやり方に小さな工夫を加える好機として読めます。'}${transitAction}具体的には、${target[1]}ことから。<br><small>基準日の${a.transit_body_ja} ${a.symbol} 出生時の${a.natal_body_ja}／ずれ${a.orb}°。出生時の${a.natal_body_ja}は第${getHouseNum(a.natal_longitude,houses)}ハウス（${HOUSE_PLAIN[getHouseNum(a.natal_longitude,houses)]}）。</small>`;
}
function calculatedTimingAspects(rows,natal){
  const angles=[{angle:0,symbol:'☌',orb:2},{angle:180,symbol:'☍',orb:2},{angle:90,symbol:'□',orb:2},{angle:120,symbol:'△',orb:2},{angle:60,symbol:'＊',orb:1.5}],hits=[];
  for(const p of rows)for(const n of natal){let d=Math.abs(p.longitude-n.longitude);d=Math.min(d,360-d);for(const a of angles)if(Math.abs(d-a.angle)<=a.orb)hits.push({transit_body:p.body,transit_body_ja:p.body_ja,natal_body:n.body,natal_body_ja:n.body_ja,natal_longitude:n.longitude,symbol:a.symbol,orb:Math.abs(d-a.angle).toFixed(2)});}
  return hits.sort((a,b)=>Number(a.orb)-Number(b.orb));
}
function currentTimingParagraphs(data,houses){
  const rows=data.transits.planets.filter(p=>TRANSIT_APPROACH[p.body]);
  const hits=calculatedTimingAspects(rows,data.natal_chart.planets).filter(a=>['Sun','Moon','Mercury','Venus','Mars'].includes(a.natal_body)).slice(0,3);
  return [...rows.map(p=>{const h=getHouseNum(p.longitude,houses),act=TIMING_ACTIONS[h],v=TRANSIT_APPROACH[p.body];return `<b>${HOUSE_PLAIN[h]}では、${v[0]}。</b>${act[1]}${v[1]}注意したいのは、${v[2]}です。<br><small>現在の${p.body_ja}：${p.sign_ja}・出生図の第${h}ハウス。</small>`;}),...hits.map(a=>timingAspectParagraph(a,houses)),`<b>いつの配置？</b>${data.transits.target_date_utc.slice(0,10)}の天体位置です。ゆっくり動く5天体が出生図のどの生活分野にあるかと、出生時の太陽〜火星に作る近い角度を重ねています。今取り組むことを選ぶための解説です。`];
}
function monthlyTimingParagraphs(row,houses){
  const p=row.monthly_profection,act=TIMING_ACTIONS[p.activated_house];
  const lord=row.monthly_transits.find(t=>t.body_ja===p.lord_of_month),lordHouse=lord?getHouseNum(lord.longitude,houses):null;
  const hits=(row.notable_transits||[]).filter(a=>NATAL_TIMING_TARGET[a.natal_body]).slice(0,3);
  const moon=row.progressed_moon;
  const changes=row.profection_changes||[];
  const opening=changes.length?`<b>${row.active_from}から${changes[0].date}の前日まで：</b>`:'';
  return [`${opening}<b>この期間は「${act[0]}」を予定に入れましょう。</b>${act[1]}気をつけたいのは、${act[2]}です。${lord&&lordHouse===p.activated_house?`<br><small>月主星の${p.lord_of_month}も、期間初日は${lord.sign_ja}・出生図の第${lordHouse}ハウスにあり、同じ生活分野が重なっています。</small>`:''}`,
  `<b>進めるときのコツ：</b>${SIGN_BEHAVIOR[p.activated_sign]}${SIGN_ADVICE[p.activated_sign]}<br><small>月別プロフェクション：${p.activated_sign}・第${p.activated_house}ハウス。</small>`,
  ...(lord&&lordHouse!==p.activated_house?[`<b>今月のテーマを、${HOUSE_PLAIN[lordHouse]}にもつなげるなら：</b>${TIMING_ACTIONS[lordHouse][1]}<br><small>月主星の${p.lord_of_month}は期間初日に${lord.sign_ja}・出生図の第${lordHouse}ハウス。</small>`]:[]),
  ...changes.map(change=>{
    const next=TIMING_ACTIONS[change.activated_house];
    return `<b>${change.date}からは「${next[0]}」。</b>${next[1]}気をつけたいのは、${next[2]}です。<br><small>月別プロフェクション：${change.activated_sign}・第${change.activated_house}ハウス。月主星は${change.lord_of_month}。</small>`;
  }),
  ...hits.map(a=>timingAspectParagraph(a,houses)),
  ...(moon?[`<b>気持ちを整えるには：</b>${SIGN_COMFORT[moon.sign_ja]}${TIMING_ACTIONS[getHouseNum(moon.longitude,houses)][1]}<br><small>期間初日の進行した月：${moon.sign_ja}・出生図の第${getHouseNum(moon.longitude,houses)}ハウス。</small>`]:[]),
  `<b>この期間の読み方：</b>${row.active_from}〜${row.active_to}の予定を考える欄です。年齢と誕生日から求める月別テーマに、期間初日の天体位置と進行した月を合わせています。角度は初日の状態で、この期間ずっと続くことや、出来事の発生日を示すものではありません。途中でテーマが切り替わる場合は、切り替わる日とその後の過ごし方を上に載せています。`];
}
const PROGRESS_GOALS={
'牡羊座':['自分で決めて始めたい','誰かの賛成を待っていた計画を、小さく試す','早く結果を出そうとして、相手の準備を置き去りにしない'],
'牡牛座':['長く使える技能や暮らしを育てたい','気に入った方法を繰り返し、上達や蓄えを記録する','今のやり方を守るために、必要な変更まで避けない'],
'双子座':['いろいろ学び、人に伝えたい','気になる分野を調べ、短い文章や会話で人に説明する','新しい情報に移る前に、一つは形に残す'],
'蟹座':['身近な人と安心できる生活を作りたい','家での時間や、信頼できる人との関わりを予定に確保する','相手を助ける前に、自分に余裕があるか確かめる'],
'獅子座':['自分の好きなことを人に見せたい','作品や企画を自分の名前で発表する','反応の多さだけで、続ける価値を決めない'],
'乙女座':['身につけた技術を、役立つ形に磨きたい','繰り返す仕事を一つ選び、手順と仕上がりを改善する','直すところを探し続けず、完成とする条件を決める'],
'天秤座':['人と協力しながら、納得できる形を作りたい','一緒に取り組む相手と、希望や役割を話す','相手の意見を聞いた後、自分の希望も伝える'],
'蠍座':['一つの仕事や関係を、深く育てたい','長く取り組むテーマを絞り、調べる・作る時間を確保する','一人で抱え込まず、共有できる相手を選ぶ'],
'射手座':['知らない世界を学び、進む方向を広げたい','専門的な学びや、普段会わない人との交流を始める','大きな目標を、今週終える作業まで分ける'],
'山羊座':['取り組みを、実績や責任ある仕事にしたい','残したい成果を決め、期限と手順を組む','役に立つことだけで、自分の価値を測らない'],
'水瓶座':['自分の考えに合う方法や仲間を見つけたい','今の仕組みで困っている点を整理し、別の方法を仲間と試す','正しい案を伝える前に、関係する人の困りごとも聞く'],
'魚座':['人の気持ちや、想像していることを形にしたい','言葉や作品で思いを表す時間、相談を聞く時間を作る','頼まれたことを全部引き受けず、できる範囲を伝える']
};
function longTimingParagraphs(data,houses){
 const sun=planetByBody(data.secondary_progressions.planets,'Sun'),moon=planetByBody(data.secondary_progressions.planets,'Moon'),natal=planetByBody(data.natal_chart.planets,'Sun'),g=PROGRESS_GOALS[sun.sign_ja],h=getHouseNum(sun.longitude,houses),mh=getHouseNum(moon.longitude,houses);
 const samples=monthlyFlowRows(data),changeIndex=samples.findIndex(r=>r.progressed_moon.sign_ja!==moon.sign_ja),change=changeIndex>0?samples[changeIndex]:null,prior=changeIndex>0?samples[changeIndex-1]:null;
 return [`<b>これから大切にしたくなるのは「${g[0]}」ということ。</b>${natal.sign_ja===sun.sign_ja?'生まれたときの太陽と同じ星座で、その方向を今も時間をかけて育てています。':`生まれたときの太陽は${natal.sign_ja}。今の進行した太陽は${sun.sign_ja}で、以前の目標に加えて、こうした望みにも時間を使いたくなる段階として読みます。`}今の関心に合うのは、${g[1]}ことです。`,
 `<b>実際に取り組む場所は、${HOUSE_PLAIN[h]}。</b>${TIMING_ACTIONS[h][1]}${g[2]}ことも大切です。<br><small>進行した太陽：${sun.sign_ja}・出生図の第${h}ハウス。</small>`,
 `<b>最近は、${HOUSE_PLAIN[mh]}が気になりやすい時期。</b>${SIGN_COMFORT[moon.sign_ja]}${TIMING_ACTIONS[mh][1]}長く続けたい目標とは別に、今落ち着ける過ごし方も用意しましょう。<br><small>進行した月：${moon.sign_ja}・出生図の第${mh}ハウス。</small>`,
 `<b>無理なく進めるなら：</b>まず「${g[1]}」ことを週の予定に一つ入れ、気持ちや続けやすさを確かめましょう。注意したいのは、${TIMING_ACTIONS[mh][2]}です。`,
 ...(change?[`<b>この先の気持ちの変化：</b>${prior.active_from}の進行した月は${prior.progressed_moon.sign_ja}、${change.active_from}には${change.progressed_moon.sign_ja}です。この間に星座が切り替わります。${SIGN_COMFORT[change.progressed_moon.sign_ja]}今の過ごし方を続けるだけでなく、新しく心地よく感じる活動にも時間を作ってみましょう。これは各期間初日の計算を比較した範囲で、切り替わる日を一日単位で特定したものではありません。`]:[]),
 `<b>どのくらいの長さの話？</b>生後一日を人生の約一年に置き換えるセカンダリープログレスを使っています。太陽の星座は数十年単位の関心、月の星座は約2〜3年の気持ちの変化として読みます。ここでは進行した天体を出生図のハウスに重ねています。`];
}
