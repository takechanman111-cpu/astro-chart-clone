/* Unknown-time results have their own surface: no known-time houses or readings. */
window.UnknownBirthTime = (() => {
  const names=['牡羊座','牡牛座','双子座','蟹座','獅子座','乙女座','天秤座','蠍座','射手座','山羊座','水瓶座','魚座'];
  const symbols=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
  const labels={common:'共通（数値検証）',conditional:'時間により変わる',unresolved:'未確定'};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=n=>((n%360)+360)%360;
  const pos=n=>{ n=norm(n); const sign=Math.floor(n/30),deg=n-sign*30; return `${names[sign]} ${Math.floor(deg)}°${String(Math.floor((deg%1)*60)).padStart(2,'0')}'`; };
  const local=s=>new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(s));
  const badge=status=>`<span class="unknown-status ${status}">${labels[status]}</span>`;
  const bodyIcons={'太陽':'sun','月':'moon','水星':'mercury','金星':'venus','火星':'mars','木星':'jupiter','土星':'saturn','天王星':'uranus','海王星':'neptune','冥王星':'pluto','ノースノード':'north-node','サウスノード':'south-node','キロン':'chiron','リリス':'lilith'};
  const bodyMeaning={'太陽':'自分で選ぶ目標','月':'安心できる過ごし方','水星':'考え方と伝え方','金星':'好きなことと人との距離感','火星':'行動と意思表示','木星':'学びと広がり','土星':'責任と積み重ね','天王星':'変化と自由','海王星':'理想と想像力','冥王星':'深い変化','ノースノード':'これから伸ばす力','サウスノード':'使い慣れた強み','キロン':'言葉に詰まりやすい場面と、そこから育つ理解','リリス':'表に出しにくい本音'};
  const signMeaning={'牡羊座':'まず動いて試す','牡牛座':'感覚で確かめ、育てる','双子座':'言葉を交わし、比べる','蟹座':'安心できるつながりを大切にする','獅子座':'自分の思いを表す','乙女座':'細部を整え、役立てる','天秤座':'相手との釣り合いを探す','蠍座':'深く関わる','射手座':'知らない世界から学ぶ','山羊座':'目標へ向けて積み重ねる','水瓶座':'当たり前を問い直す','魚座':'気持ちを受け取り、想像する'};
  const signRisk={'牡羊座':'急いで相手の準備を待てなくなる','牡牛座':'慣れたやり方から離れにくくなる','双子座':'選択肢を増やし過ぎる','蟹座':'守ろうとして外の意見を遠ざける','獅子座':'反応や評価に気を取られる','乙女座':'細部を気にして始めにくくなる','天秤座':'自分の希望を後回しにする','蠍座':'警戒して相手に任せにくくなる','射手座':'先を急いで細部を見落とす','山羊座':'責任を抱え込み休みにくくなる','水瓶座':'理屈が先に立ち身近な気持ちを見落とす','魚座':'人の問題まで抱え込む'};
  const angleMeaning=name=>/オポジション/.test(name)?'二つを両方求めて揺れやすい':/スクエア/.test(name)?'同時に進めようとするとぶつかりやすい':/コンジャンクション/.test(name)?'二つが一緒に強く出やすい':/トライン/.test(name)?'自然に助け合いやすい':'意識して結びつけると力になる';
  const icon=name=>`<img src="assets/${bodyIcons[name]||'structure'}-generated.png" alt="" aria-hidden="true" loading="lazy">`;
  const detail=(title,body,icons)=>`<details class="explain-item"><summary><span class="explain-icons">${icons}</span><span>${esc(title)}を詳しく読む</span></summary>${window.detailIllustrations(title,[...icons.matchAll(/assets\/([a-z-]+)-generated/g)].map(m=>m[1]))}${body.map(t=>`<p>${t}</p>`).join('')}</details>`;
  let text='';

  function clear() {
    text='';
    const area=document.getElementById('unknownResult');
    area.hidden=true; area.replaceChildren();
  }

  function wheel(planets) {
    const xy=(lon,r)=>[200+r*Math.cos((180-lon)*Math.PI/180),200+r*Math.sin((180-lon)*Math.PI/180)];
    let svg='<svg viewBox="0 0 400 400" role="img" aria-label="ハウスなしの参考配置図。正確な範囲は天体表をご覧ください。"><circle cx="200" cy="200" r="175" fill="none" stroke="#74748e"/>';
    for(let s=0;s<12;s++) {
      const a=xy(s*30,145),b=xy(s*30,175),p=xy(s*30+15,160);
      svg+=`<path d="M${a} L${b}" stroke="#74748e"/><text x="${p[0]}" y="${p[1]}" fill="#d5cdeb" text-anchor="middle" dominant-baseline="middle" font-size="17">${symbols[s]}</text>`;
    }
    planets.forEach((p,i)=>{
      const r=30+i*12,point=xy(p.reference_longitude,r),a=xy(p.min_longitude,r-6),b=xy(p.max_longitude,r-6);
      svg+=`<path d="M${a} A${r-6},${r-6} 0 0 0 ${b}" stroke="#d9b26f" stroke-width="3" fill="none"/><circle cx="${point[0]}" cy="${point[1]}" r="5" fill="#ddd3ed"/><text x="${point[0]}" y="${point[1]+.5}" fill="#141421" text-anchor="middle" dominant-baseline="middle" font-size="7">${i+1}</text>`;
    });
    return svg+'</svg>';
  }

  function render(data) {
    if(data.schema!=='unknown-birth-time/v1'||data.engine_id!=='swetest_cli') throw new Error('時間不明用の計算結果を取得できませんでした。');
    const area=document.getElementById('unknownResult');
    const range=`${local(data.interval.start_utc)} ～ ${local(data.interval.end_utc_exclusive)}未満`;
    const lines=['■ ホロスコープ命式データ（出生時間不明）',`生年月日：${data.input.year}年${data.input.month}月${data.input.day}日`,'出生時間：不明',
      `対象時間帯：${range}（${data.interval.time_zone}）`,`図の代表時刻：${local(data.reference_time_utc)}（出生時刻ではありません）`,data.note];
    const table=(title,rows)=>{
      lines.push(`\n【${title}】`);
      const body=rows.map((p,i)=>{
        const sign=p.sign.candidates.map(s=>names[s]).join(' / ');
        const span=`${pos(p.min_longitude)} ～ ${pos(p.max_longitude)}`;
        const motion=p.motion.value==='direct'?'順行':p.motion.value==='retrograde'?'逆行':labels[p.motion.status];
        const sabian=p.sabian.status==='common'?`${names[Math.floor(p.sabian.candidates[0]/30)]} 第${p.sabian.candidates[0]%30+1}度`:'未採用（時間幅で未確定）';
        lines.push(`${p.name}：${sign}［${labels[p.sign.status]}］／位置範囲 ${span}／${motion}／サビアン ${sabian}`);
        return `<tr><th scope="row">${title==='10天体'?`${i+1}. `:''}${esc(p.name)}</th><td>${esc(sign)}<br>${badge(p.sign.status)}</td><td>${esc(span)}</td><td>${motion}</td><td>${esc(sabian)}</td></tr>`;
      }).join('');
      const details=rows.map(p=>{
        const candidates=p.sign.candidates.map(s=>names[s]);
        const reading=candidates.map(s=>`${s}の場合：${typeof planetSignReading==='function' && (p.name==='月'||window.PERSONAL_PLANET_READINGS?.[p.name])?planetSignReading(p.name,s):signMeaning[s]+'ことを大切にします。'}`).join(' ' );
        const cautions=candidates.map(s=>`${s}では${signRisk[s]}こともあります。${window.ASTRO_SIGN_ADVICE?.[s]||''}`).join(' ');
        return detail(p.name,[`<b>${esc(p.name)}を見ると：</b>${esc(bodyMeaning[p.name]||'自分の傾向')}について、${esc(reading)}`,`<b>気をつけたいとき：</b>${esc(cautions)}`,`<b>今回の星座：</b>${p.sign.status==='common'?'この日のどの時刻でも星座は変わりません。':'出生時刻によって星座が変わるため、上の両方が候補です。'}`,`<b>出生時刻が分かると：</b>ハウスを計算でき、仕事、家庭、人間関係など、どこでこの持ち味が出やすいかも見られます。`],icon(p.name));
      }).join('');
      return `<section class="panel"><h2 class="panel-title">${title}</h2><div class="unknown-table"><table class="dt"><thead><tr><th>天体</th><th>サイン・判定</th><th>一日の位置範囲</th><th>順逆行</th><th>サビアン度数</th></tr></thead><tbody>${body}</tbody></table></div>${details}</section>`;
    };
    let html=`<section class="panel"><h2>出生時間不明のホロスコープ</h2><p class="timing-note">${esc(range)}（日本の現地日付）</p><p>出生時間は不明のまま、天体ごとに変わる部分を分けています。</p><p class="timing-note">${esc(data.note)}</p></section>
      <div class="chart-grid"><div class="chart-wrap">${wheel(data.planets)}<p>出生時間不明・参考配置</p><p class="timing-note">点は${esc(local(data.reference_time_utc))}の参考位置。色の線は位置の幅です。図の番号は10天体表に対応します。ハウスや上昇点ではありません。</p></div><section class="panel"><h2 class="panel-title">読み取れること・決めないこと</h2><p><strong>共通（数値検証）</strong><br>指定した時間幅で数値的に共通する項目です。</p><p><strong>時間により変わる</strong><br>時刻により異なる結果があるため、両方の候補を残します。</p><p><strong>未確定</strong><br>境界付近や検証不足のため、決めつけず保留します。</p><p class="timing-note">ASC・MC・ハウス・チャートルーラー・半球分布は算出しません。時期読みは時間不明用の期間検証が未実装のため、今回は表示しません。</p></section></div>`;
    html+=table('10天体',data.planets)+table('補助天体・感受点',data.points);
    lines.push('\n【アスペクト】','10天体の組み合わせ。0・90・120・180度はオーブ8度、60度は6度。');
    html+='<section class="panel"><h2 class="panel-title">アスペクトの時間幅</h2><div class="unknown-table"><table class="dt"><thead><tr><th>天体</th><th>関係</th><th>オーブ範囲</th><th>判定</th></tr></thead><tbody>';
    data.aspects.forEach(a=>{
      const s=`${a.first} × ${a.second}：${a.name}／${a.min_orb.toFixed(3)}～${a.max_orb.toFixed(3)}度／${labels[a.status]}`;
      lines.push(s);
      html+=`<tr><td>${esc(a.first)} × ${esc(a.second)}</td><td>${esc(a.name)}</td><td>${a.min_orb.toFixed(3)}～${a.max_orb.toFixed(3)}°</td><td>${badge(a.status)}</td></tr>`;
    });
    html+='</tbody></table></div>';
    html+=data.aspects.map(a=>detail(`${a.first}と${a.second}の${a.name}`,[`<b>この組み合わせで分かること：</b>${esc(a.first)}の${esc(bodyMeaning[a.first]||'テーマ')}と、${esc(a.second)}の${esc(bodyMeaning[a.second]||'テーマ')}は、${angleMeaning(a.name)}関係です。両方が働くときの強みと、負担になりやすい使い方を見ます。`,`<b>強みとつまずき：</b>${angleMeaning(a.name)}ため、二つの力を役割分担できれば生かせます。一方だけを優先し続けると、もう一方が負担になることがあります。`,`<b>時刻が不明なため：</b>角度のずれは${a.min_orb.toFixed(3)}～${a.max_orb.toFixed(3)}度で、判定は「${labels[a.status]}」。時間によって成立が変わる場合は確定した特徴として扱いません。`,`<b>次に何を見る？</b>強みの使いどころは二つの天体の星座と実際の経験で確かめます。出来事の時期には現在の天体との角度や年・月のテーマも必要ですが、このモードでは出生時刻に依存するハウスと時期読みを表示していません。出生時刻が分かれば再計算できます。`],icon(a.first)+icon(a.second))).join('');
    html+='</section>';
    lines.push('\n【資質バランス】');
    html+='<section class="panel"><h2 class="panel-title">資質バランス（10天体）</h2><div class="bal-grid">';
    data.balance.forEach(g=>{
      const summary=g.items.map(i=>`${i.label}：${i.min===i.max?i.min:`${i.min}～${i.max}`}天体`).join(' / ');
      lines.push(`${g.name}：${summary}／${g.status==='common'?labels.common:'検証点での範囲・未確定'}`);
      html+=`<div><h3>${esc(g.name)}</h3><p>${esc(summary)}</p>${g.status==='common'?badge('common'):'<p>検証点での範囲・未確定</p>'}</div>`;
    });
    html+='</div></section>';
    const allCommon=data.planets.every(p=>p.sign.status==='common');
    if(allCommon && typeof calcDispositorChain==='function') {
      const chains=calcDispositorChain(data.planets.map(p=>({name:p.name,signIdx:p.sign.candidates[0]})));
      lines.push('\n【ディスポジター・チェーン（モダン支配星）】');
      html+='<section class="panel"><h2 class="panel-title">支配星のつながり</h2>';
      chains.forEach(c=>{const s=`${c.planet}：${c.chain.join(' → ')}`;lines.push(s);html+=`<p>${esc(s)}</p>`;});
      html+='</section>';
    } else { lines.push('\n支配星のつながり：サインが未確定の天体を含むため未採用。'); }
    lines.push('\n【境界・留の検証記録】');
    data.events.forEach(e=>lines.push(`${e.body}／${e.type}：${local(e.from_utc)}～${local(e.to_utc)}（検出区間）`));
    lines.push('\n【採用しない項目】',data.unavailable.join('、'),
      '\n【計算条件】','Swiss Ephemeris swetest／地心・トロピカル／平均ノード・平均リリス',
      `検証点数：${data.verification.sample_count}／角度許容差：${data.verification.angular_tolerance_degrees}度`,
      '数値的な共通は、占星術による性格や未来の解釈の正しさを保証するものではありません。');
    text=lines.join('\n');
    html+='<section class="panel"><h2 class="panel-title">鑑定用データ</h2><button type="button" id="unknownCopy" class="btn">鑑定用データをコピー</button><p id="unknownCopyStatus" role="status"></p><details><summary>テキストを表示</summary><pre id="unknownText" class="unknown-text"></pre></details></section>';
    area.innerHTML=html;
    area.querySelector('#unknownText').textContent=text;
    area.querySelector('#unknownCopy').addEventListener('click',async()=>{
      try { await navigator.clipboard.writeText(text); area.querySelector('#unknownCopyStatus').textContent='コピーしました。'; }
      catch { area.querySelector('details').open=true; area.querySelector('#unknownCopyStatus').textContent='自動コピーできませんでした。表示されたテキストを選択してコピーしてください。'; }
    });
    area.hidden=false;
    area.scrollIntoView({behavior:'smooth'});
  }
  return {clear,render};
})();
