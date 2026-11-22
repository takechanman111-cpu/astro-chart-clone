import {SIGNS,PLANETS,NAKS,DIGNITY,zodiacImagePath,topicImagePath} from './data.mjs';
import {CITIES} from './cities.mjs';
import {daysInMonth,birthdateISO} from './data.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=(ms,zone='Asia/Tokyo')=>new Intl.DateTimeFormat('ja-JP',{timeZone:zone,year:'numeric',month:'long',day:'numeric'}).format(ms);
const clock=(ms,zone)=>new Intl.DateTimeFormat('ja-JP',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(ms);
const today=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const g=t=>p.find(x=>x.type===t).value;return `${g('year')}-${g('month')}-${g('day')}`;};
$('#as-of').value=today();
$('#birth-month').insertAdjacentHTML('beforeend',Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}月</option>`).join(''));
function updateBirthDays(){
 const old=$('#birth-day').value,count=daysInMonth($('#birth-year').value,$('#birth-month').value);
 $('#birth-day').innerHTML='<option value="">日</option>'+Array.from({length:count},(_,i)=>`<option value="${i+1}">${i+1}日</option>`).join('');
 if(old&&Number(old)<=count)$('#birth-day').value=old;
 $('#birthdate-notice').textContent=old&&Number(old)>count?'選んだ年月にない日です。日を選び直してください。':'年は数字で直接入力できます。';
}
$('#birth-year').addEventListener('input',updateBirthDays);$('#birth-month').addEventListener('change',updateBirthDays);updateBirthDays();
const cityGroups=[['日本',CITIES.filter(x=>x.zone==='Asia/Tokyo')],['海外',CITIES.filter(x=>x.zone!=='Asia/Tokyo')]];
$('#city').insertAdjacentHTML('beforeend',cityGroups.map(([name,cs])=>`<optgroup label="${name}">${cs.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</optgroup>`).join('')+'<option value="custom">緯度・経度で指定する</option>');
const zones=Intl.supportedValuesOf?Intl.supportedValuesOf('timeZone'):CITIES.map(x=>x.zone);if(!zones.includes('Asia/Tokyo'))zones.push('Asia/Tokyo');$('#zone').innerHTML=[...new Set(zones)].sort().map(z=>`<option value="${esc(z)}">${esc(z)}</option>`).join('');$('#zone').value='Asia/Tokyo';
$('#city').addEventListener('change',()=>{$('#custom-fields').hidden=$('#city').value!=='custom';for(const id of ['lat','lon','zone'])$('#'+id).required=$('#city').value==='custom';});
$('#accuracy').addEventListener('change',()=>{const x=$('#accuracy').value;$('#time-fields').hidden=x==='unknown';$('#birth-time').required=x!=='unknown';$('#birth-time').disabled=x==='unknown';$('#margin-fields').hidden=x!=='approximate';$('#unknown-note').hidden=x!=='unknown';});
let currentResult=null;
$('#birth-form').addEventListener('input',()=>{const old=$('#stale-result');if(currentResult&&!old)$('#results').insertAdjacentHTML('afterbegin','<p id="stale-result" class="notice" role="status">入力を変更しました。下は前回の結果です。「星の配置を読み解く」を押すと、新しい情報で計算します。</p>');});
const paras=ps=>ps.map(p=>`<div class="paragraph"><h4>${esc(p.label)}</h4><p>${esc(p.text)}</p></div>`).join('');
const basis=b=>`<details class="basis"><summary>この解説の根拠を見る</summary><ul>${b.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>出生図・分割図・期間の伝統的な象意を、初心者向けの日本語で説明しています。個人の経験を確定するものではありません。</p></details>`;
const topicLabels={lagna:'ラグナ',nakshatra:'ナクシャトラ',dasha:'ダシャー',navamsa:'ナヴァムシャ',...Object.fromEntries(Object.entries(PLANETS).map(([k,p])=>[k,p.name]))};
const zodiacFigure=(visual,size='normal')=>{
 const src=zodiacImagePath(visual?.sign);if(!src)return '';
 return `<figure class="result-sign sign-${size}" data-sign="${visual.sign}"><img src="${src}" alt="${SIGNS[visual.sign].name}のイメージ" width="128" height="128" loading="lazy" decoding="async"><figcaption>${esc(visual.caption||SIGNS[visual.sign].name)}</figcaption></figure>`;
};
const vedicMeanings={
 sun:'太陽は、魂（アートマン）・自己・生命力を表す星です。父、権威、社会的な立場なども象意に含みます。',
 moon:'月は心を表し、母や心の安らぎなどにも関わります。',
 mercury:'水星は言葉・学習・記憶・知的な働きなどに関わります。',
 venus:'金星は配偶者や結婚生活、親密さ、楽しみ、創造的な表現などに関わります。',
 mars:'火星は力・勇気などを表し、弟妹や対立などの象意もあります。',
 jupiter:'木星は知識・知恵・師などを表し、子どもや財にも関わります。',
 saturn:'土星は労働・苦労・悲しみ・寿命などの象意を持ちます。土星だけで人生全体を悪いと決めたり、寿命を断定したりはしません。'
};
const topicIllustration=visual=>{
 const src=topicImagePath(visual?.topic);if(!src)return '';
 const label=topicLabels[visual.topic];
 return `<div class="concept-visual"><h4>${esc(label)}のイメージ</h4>${vedicMeanings[visual.topic]?`<p class="vedic-meaning">${esc(vedicMeanings[visual.topic])}</p>`:''}<figure><img src="${src}" alt="${esc(label)}を同じキャラクターで表した説明画像" loading="lazy" decoding="async"><figcaption>${vedicMeanings[visual.topic]?'画像は象意の一部を取り上げたイメージです。':esc(label)+'を表すイメージです。'}今回の配置や期間は本文で確認できます。</figcaption></figure></div>`;
};
const card=r=>`<article class="reading-card" data-reading="${esc(r.key||'period')}"${Number.isInteger(r.visual?.sign)?` data-result-sign="${r.visual.sign}"`:''}><div class="reading-heading"><div><h3>${esc(r.title)}</h3>${r.subtitle?`<p class="subtitle">${esc(r.subtitle)}</p>`:''}</div>${zodiacFigure(r.visual)}</div>${paras(r.paragraphs)}${topicIllustration(r.visual)}${basis(r.basis)}</article>`;
const section=(id,n,title,intro='')=>`<div id="${id}" class="section-title"><span>${n}</span><h2>${title}</h2></div>${intro?`<p class="section-intro">${intro}</p>`:''}`;
const degrees=x=>{let total=Math.round(x*3600);const d=Math.floor(total/3600),m=Math.floor(total%3600/60),s=total%60;return `${d}°${String(m).padStart(2,'0')}′${String(s).padStart(2,'0')}″`;};
function chartHTML(r,d9=false){
 const matrix=[[11,0,1,2],[10,-1,-1,3],[9,-1,-1,4],[8,7,6,5]],c=r.chart,asc=d9?r.d9Asc:c.lagna;
 const allowed=d9?r.d9.map(x=>x.key):(r.uncertainty?.stableKeys||c.planets.map(p=>p.key));
 let s='<div class="south-chart" role="img" aria-label="'+(d9?'D9ナヴァムシャ':'D1出生図')+'。配置の詳細は下の天体一覧に記載。">';
 matrix.forEach((row,y)=>row.forEach((sign,x)=>{if(sign<0)return;const ps=c.planets.filter(p=>allowed.includes(p.key)&&(d9?p.d9:p.sign)===sign),house=asc===null?'':(sign-asc+12)%12+1;
 s+=`<div class="chart-cell ${asc===sign?'asc':''}" style="grid-column:${x+1};grid-row:${y+1}"><div class="chart-sign">${SIGNS[sign].name}${!d9&&house?` ${house}室`:''}</div><div class="chart-planets">${asc===sign?'Asc ':''}${ps.map(p=>PLANETS[p.key].name).join(' ')}</div></div>`;}));
 return s+`<div class="chart-center"><span>${d9?'D9':'D1'}</span><small>${d9?'ナヴァムシャ':'ラーシ／出生図'}</small><span>✧</span></div></div>`;
}
function periodCard(x,r,future=false){
 const m=PLANETS[x.maha],a=PLANETS[x.antar],approx=r.input.accuracy==='approximate';
 const dateLabel=approx?'入力時刻を中心とした目安：':'期間：';
 const heading=`<div class="period-top"><div><div class="period-label"><span>${future?'次の時期':'現在の時期'}</span><b>${m.name} × ${a.name}</b></div><p class="${future?'subtitle':''}">${dateLabel}${date(x.start)} 〜 ${date(x.end)}${approx?' 頃':''}</p><span class="tag ${future?'gold':''}">${esc(x.status)}</span><span class="tag ${future?'':'gold'}">${future?'':'今のテーマ：'}${esc(x.theme)}</span><h3>${esc(x.title)}</h3></div>${zodiacFigure(x.visual,'period')}</div>`;
 return future?`<article class="reading-card">${heading}${paras(x.paragraphs)}${basis(x.basis)}</article>`:`<div class="fortune-heading">${heading}</div><article class="reading-card fortune-body">${paras(x.paragraphs)}${topicIllustration(x.visual)}${basis(x.basis)}</article>`;
}
function render(r,isSample){
 currentResult=r;const c=r.chart,unknown=r.input.accuracy==='unknown',approx=r.input.accuracy==='approximate',lagna=c.lagna;
 const now=r.timing?.current,nak=r.readings.nak;
 let h=`<div class="result-head"><p class="eyebrow">YOUR PERSONAL READING</p><h2>あなたの星の配置と、今の運勢</h2><p class="meta">${esc(r.input.date)} ${unknown?'出生時刻不明':esc(r.input.time)} ／ ${esc(r.input.place.name)}<br>運勢の基準日：${esc(r.input.asOf)}（日本時間12時）</p>${isSample?'<p class="sample-label">架空の入力例から計算した結果です。あなたご本人の鑑定結果ではありません。</p>':''}</div>`;
 if(r.input.birth.ambiguous)h+='<p class="notice">この出生日時は夏時間の終了により同じ時刻が2回あります。詳しい計算設定の「先／後」の選択に従って計算しています。記録と合っているか確認してください。</p>';
 if(unknown)h+='<p class="notice">出生時刻が分からないため、当日の時間帯ごとに変わる配置を確認しました。確定できない資質や運勢の切替日は表示していません。下の解説は、一日を通して星座が変わらない項目を中心にしています。</p>';
 if(approx)h+=`<p class="notice">入力時刻の前後${r.input.margin}分を確認した結果です。${r.uncertainty.stableAsc?'ラグナの星座はこの範囲で変わりません。':'この範囲でラグナが変わるため、室を使う解説と運勢は確定表示していません。'} 解説・図には範囲内で変わらない項目を優先し、運勢の日付は幅のある目安として示します。</p>`;
 h+='<nav class="nav" aria-label="結果の項目"><a href="#qualities">資質・強み</a><a href="#life-areas">仕事・関係</a><a href="#fortune">今の運勢</a><a href="#charts">星の配置</a></nav>';
 h+=section('qualities','01','あなたの資質と強み','生まれたときの配置から、物事への取りかかり方や心の動き、得意な力を読みます。');
 h+=r.readings.blocks.map(card).join('');
 if(r.readings.strengths.length)h+=`<div class="section-title"><h2>力を生かせる、3つの方向</h2></div><p class="section-intro">主要な星の配置から、使いどころを三つ取り上げました。才能の順位や点数ではありません。</p><div class="strength-grid">${r.readings.strengths.map((s,i)=>`<article class="strength"><div class="strength-with-image">${zodiacFigure(s.visual,'small')}<div><h3>${String(i+1).padStart(2,'0')}　${esc(s.title)}</h3><p>${esc(s.text)}</p><small>根拠：${esc(s.basis)}</small></div></div></article>`).join('')}</div>`;
 if(nak)h+=card(nak);
 if(r.unknownCandidates.length){h+=section('moon-candidates','', '出生時刻によって変わる月の候補',`時間帯は出生地（${esc(r.input.place.zone)}）の時計時刻です。日付をまたぐ終端は翌日の0時です。境界は分単位で丸めた目安です。`);h+=r.unknownCandidates.map(x=>`<article class="unknown-range"><div class="range-time">${clock(x.start,r.input.place.zone)} 〜 ${clock(x.end,r.input.place.zone)} ごろ</div><div class="candidate-heading">${zodiacFigure(x.visual,'small')}<h3>月：${SIGNS[x.sign].name} ／ ${esc(x.name)}</h3></div><span class="tag">第${x.pada}パーダ</span><p>${esc(x.moon)}</p><p>${esc(x.reading)}</p></article>`).join('');}
 h+=section('life-areas','02','仕事・お金・人間関係','室（ハウス）は、仕事や家庭など生活の分野を分けたもの。支配星は、その室に対応する星です。どの分野で、どう力を使うかを、その星の実際の配置と合わせて読みます。');
 h+=r.areas.length?r.areas.map(card).join(''):'<p class="notice">出生時刻から室を確定できないため、この分野の個別解説は表示していません。上の資質や、下の星座ごとの解説は確認できます。</p>';
 h+=section('fortune','03','今の運勢と、次の時期','ダシャーは、出生時の月の位置から求める時期の区切りです。長い大周期の中に、より短い小周期が重なります。期間は日本時間で表示し、終了日は次の周期に切り替わる日を表します。');
 if(now){
  h+=`<p class="section-intro">大周期：${PLANETS[r.timing.maha.key].name}（${date(r.timing.maha.start)} 〜 ${date(r.timing.maha.end)}${approx?' 頃':''}）</p>`;
  if(approx){const t=r.timing.range;h+=`<p class="notice">時刻の幅を考慮した小周期の開始日の範囲：${date(t.startMin)} 〜 ${date(t.startMax)}。終了日の範囲：${date(t.endMin)} 〜 ${date(t.endMax)}。下の日付は入力時刻を中心とした目安です。</p>`;}
  h+=periodCard(now,r);h+='<div class="section-title"><h2>この先の3つの時期</h2></div><div class="timeline">'+r.timing.upcoming.map(x=>periodCard(x,r,true)).join('')+'</div>';
  h+='<div class="section-title"><h2>今の星の動きからの補足</h2></div><p class="section-intro">木星・土星の現在位置から見た補足です。出生図の資質やダシャーの期間とは分けて表示しています。</p>'+r.timing.transits.map(card).join('');
  h+=`<details class="technical"><summary>大周期の一覧を見る</summary><p class="hint">最初の大周期は出生前から始まっています。生まれた日を起点に小周期を配り直していません。</p><div class="table-wrap"><table><thead><tr><th>大周期</th><th>開始</th><th>終了</th></tr></thead><tbody>${r.timing.periods.map(x=>`<tr><td>${PLANETS[x.key].name}${x.key===r.timing.maha.key&&x.start===r.timing.maha.start?'（現在）':''}</td><td>${date(x.start)}${approx?'頃':''}</td><td>${date(x.end)}${approx?'頃':''}</td></tr>`).join('')}</tbody></table></div></details>`;
 }else if(r.timing?.possible?.length>1){h+=`<p class="notice">指定した時刻の幅では、現在の周期が${r.timing.possible.map(x=>PLANETS[x.maha].name+' × '+PLANETS[x.antar].name).join('、')}に分かれます。一つに決めず、出生時刻の確認後に詳しく表示します。</p>`;}
 else h+='<p class="notice">現在の運勢周期を確定するには、出生時刻が必要です。正午などの仮の時刻から、確定した切替日や今の運勢を作ることはしていません。</p>';
 h+=section('charts','04','星の配置を詳しく見る','D1は基本の出生図。D9は星座をさらに細かく分けた補助図です。D9だけで結婚や人生の出来事を決めず、D1と合わせて読みます。');
 if(!unknown)h+=topicIllustration({topic:'navamsa'});
 h+=`<div class="chart-pair"><div class="chart-box"><h3>D1 · ラーシ／基本の出生図</h3>${chartHTML(r)}<p class="chart-note">南インド式。星座の位置は固定です。${unknown?'一日を通して星座が同じ星だけを載せています。':lagna===null?'ラグナと室番号は確定していません。':'色の付いたマスのAscがラグナ（東の地平線）の星座です。そこから1室、2室…と数えます。'}</p></div><div class="chart-box"><h3>D9 · ナヴァムシャ／補助図</h3>${unknown?'<p class="notice">時刻が分からないため、この版ではD9の図と解説を表示していません。</p>':chartHTML(r,true)}<p class="chart-note">${approx?'時刻の幅の中で星座が変わらない星だけを表示しています。':''}D9は、各星座を9つに分けた配置です。図の描き方はD1と同じです。</p></div></div>`;
 h+='<div class="section-title"><h2>天体の一覧と、個別の解説</h2></div><p class="section-intro">天体ごとに、意味・今回の配置・強み・注意点を表示しています。</p>';
 h+=`<div class="table-wrap"><table><thead><tr><th>天体</th><th>星座</th><th>度数</th><th>室</th><th>月の宿区分</th></tr></thead><tbody>${c.planets.map(p=>{const stable=!r.uncertainty||r.uncertainty.stableKeys.includes(p.key);return `<tr><td>${PLANETS[p.key].name}${p.retro&&!unknown&&!['rahu','ketu'].includes(p.key)?' ℞':''}</td><td>${stable?SIGNS[p.sign].name:'時刻で変化'}</td><td>${unknown?'—':degrees(p.degree)+(approx?'（目安）':'')}</td><td>${p.house&&stable?p.house+'室':'—'}</td><td>${unknown||approx?'時刻で変わるため参考欄を省略':NAKS[p.nak.index][0]+' '+p.nak.pada}</td></tr>`;}).join('')}</tbody></table></div><p class="hint">ラーフ・ケートゥは月の軌道と黄道の交点です。℞は逆行（地球から見た動き）を表します。</p>`;
 h+=r.readings.planets.map(p=>`<details class="planet-details" open><summary>${esc(p.title)}<span class="tag">${esc(p.subtitle)}</span></summary>${card(p)}</details>`).join('');
 if(r.d9.length){h+='<div class="section-title"><h2>D9で補足される持ち味</h2></div>';h+=r.d9.map(x=>`<details class="planet-details" open><summary>${PLANETS[x.key].name}：${SIGNS[x.sign].name} ${x.same?'<span class="tag gold">D1と同じ星座</span>':''}</summary><article class="reading-card">${zodiacFigure(x.visual)}<div class="paragraph"><p>${esc(x.text)}</p></div><p class="hint">${esc(x.basis)}</p></article></details>`).join('');}
 const ay={1:'ラヒリ',3:'ラーマン',5:'クリシュナムルティ'}[r.engine.ayanamsa];
 h+=`<details class="technical"><summary>計算条件・参考資料</summary><dl><dt>黄道</dt><dd>サイデリアル</dd><dt>星座の基準</dt><dd>${ay}（mode ${r.engine.ayanamsa}）／${r.engine.ayanamsaValue.toFixed(6)}度</dd><dt>ラーフ</dt><dd>${r.engine.node==='mean'?'平均交点':'真交点'}</dd><dt>ハウス</dt><dd>ホールサイン（D1）</dd><dt>ダシャー年</dt><dd>${r.engine.yearDays}日</dd><dt>計算エンジン</dt><dd>Swiss Ephemeris ${esc(r.engine.version)}／地心・見かけの位置</dd><dt>出生地時差</dt><dd>${esc(r.input.place.zone)}／UTC${r.input.birth.offset>=0?'+':''}${r.input.birth.offset}</dd><dt>時刻データ</dt><dd>IANA tzdb ${esc(r.engine.tzdb)}／ICU ${esc(r.engine.icu)}</dd></dl><p class="hint">${esc(r.sources.core)}</p><p class="hint">27宿の性質、日常の例、具体的な行動は、伝統的な象意をもとにした本アプリの日本語編集です。本人の監修済み講義原稿ではありません。</p><p class="hint">この版は全体を一つの吉凶点数にはしません。高揚・減衰も、その星座だけで人生の良し悪しを決める判定には使いません。</p></details><div class="result-actions"><button type="button" class="quiet-button" id="back-to-form">入力を見直す ↑</button><button type="button" class="quiet-button" id="expand-all">天体の解説を閉じる</button></div>`;
 $('#results').innerHTML=h;$('#results').hidden=false;$('#empty').hidden=true;
 $('#back-to-form').addEventListener('click',()=>$('#birth-form').scrollIntoView({behavior:'smooth',block:'start'}));$('#expand-all').addEventListener('click',()=>{const ds=[...document.querySelectorAll('.planet-details')],open=ds.some(x=>!x.open);ds.forEach(x=>x.open=open);$('#expand-all').textContent=open?'天体の解説を閉じる':'天体の解説をすべて開く';});
 $('.input-panel').scrollTop=0;$('#results').scrollIntoView({behavior:'smooth',block:'start'});
}
async function submit(isSample=false){
 if(!$('#birth-form').reportValidity())return;
 const body=Object.fromEntries(new FormData($('#birth-form')));try{body.date=birthdateISO(body.birthYear,body.birthMonth,body.birthDay);}catch(e){$('#error').textContent=e.message;$('#error').hidden=false;return;}
 const fields=[...document.querySelectorAll('#birth-form input,#birth-form select')].map(el=>[el,el.disabled]);fields.forEach(([el])=>el.disabled=true);$('#error').hidden=true;$('#calculate').disabled=true;$('#sample').disabled=true;$('#busy').hidden=false;$('#calculate').textContent='計算しています…';
 try{const res=await fetch('/api/vedic-natal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw new Error(data.error||'計算できませんでした。');render(data,isSample);}
 catch(e){$('#error').textContent=e.message;$('#error').hidden=false;}
 finally{fields.forEach(([el,disabled])=>el.disabled=disabled);$('#calculate').disabled=false;$('#sample').disabled=false;$('#busy').hidden=true;$('#calculate').innerHTML='星の配置を読み解く <span aria-hidden="true">→</span>';}
}
$('#birth-form').addEventListener('submit',e=>{e.preventDefault();submit(false);});
$('#sample').addEventListener('click',()=>{$('#birth-year').value='1990';$('#birth-month').value='1';updateBirthDays();$('#birth-day').value='1';$('#birth-time').value='12:00:00';$('#accuracy').value='exact';$('#accuracy').dispatchEvent(new Event('change'));$('#city').value=CITIES.find(x=>x.name==='大阪市').id;$('#city').dispatchEvent(new Event('change'));$('#ayanamsa').value='lahiri';$('#node').value='mean';$('#yearDays').value='365.25';$('#as-of').value=today();submit(true);});
