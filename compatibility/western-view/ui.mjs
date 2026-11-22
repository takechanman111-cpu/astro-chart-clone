const form = document.querySelector('#birth-form');
const result = document.querySelector('#result');
const status = document.querySelector('#status');
const submit = form.querySelector('button');
const option = (value,label=value) => `<option value="${value}">${label}</option>`;
const choices = (count,start=1) => Array.from({length:count},(_,i) => option(i+start)).join('');
const select = (field,label,options) => `<label>${label}<select name="${field}" required>${option('', '選択')}${options}</select></label>`;

document.querySelector('#people').innerHTML = ['A','B'].map(person => `
  <fieldset data-person="${person}">
    <legend>${person}さん</legend>
    <div class="fields">
      <label>西暦年<input name="year" type="number" inputmode="numeric" min="1952" max="2099" placeholder="例 1996" required></label>
      ${select('month','月',choices(12))}
      ${select('day','日',choices(31))}
    </div>
    <div class="fields time">
      ${select('hour','出生時（24時間制）',choices(24,0))}
      ${select('minute','分',choices(60,0))}
    </div>
  </fieldset>`).join('');

const people = Array.from(form.querySelectorAll('fieldset'));
for (const person of people) {
  const year = person.querySelector('[name=year]');
  const month = person.querySelector('[name=month]');
  const day = person.querySelector('[name=day]');
  const updateDays = () => {
    const previous = day.value;
    const count = year.validity.valid && month.value
      ? new Date(Date.UTC(Number(year.value),Number(month.value),0)).getUTCDate()
      : 31;
    day.innerHTML = option('','選択') + choices(count);
    day.value = previous && Number(previous) <= count ? previous : '';
    previous && !day.value ? status.textContent = '日を選び直してください。' : status.textContent = '';
  };
  year.addEventListener('input',updateDays);
  month.addEventListener('change',updateDays);
}

const position = row => `${row.body_ja} ${row.sign_ja}${row.degree}°${String(row.minute).padStart(2,'0')}′`;
function roleNames(note,match) {
  return note.replace(/(太陽|月|水星|金星|火星)側/g, (_, name) => match.a.body_ja === name ? 'Aさん' : 'Bさん');
}

function show({first,second,matches}) {
  document.querySelector('#summary').textContent = matches.length
    ? '二人の関係を読み解く手がかりが' + matches.length + '件あります。会話や休日の過ごし方など、気になるところから読んでみてください。'
    : '二人の5つの天体を比べたところ、今回取り上げている5種類の角度に当てはまるものはありませんでした。天体の位置は下から確認できます。';
  document.querySelector('#matches').innerHTML = matches.map(match => {
    const {a,b,angle,aspect,offset,title,reading} = match;
    return `<article class="match">
      <h3>${title}</h3>
      <p>${roleNames(reading,match)}</p>
      <details><summary>この読みの根拠</summary>
        <p>Aさんの${position(a)} × Bさんの${position(b)}</p>
        <p class="math">${aspect.name}（基準 ${aspect.angle}°）。実際の角度 ${angle.toFixed(2)}°、ずれ ${offset.toFixed(2)}°。</p>
      </details></article>`;
  }).join('');
  document.querySelector('#positions').innerHTML = [first,second].map((rows,i) =>
    `<div><strong>${i ? 'B' : 'A'}さん</strong><ul>${rows.map(row => `<li>${position(row)}</li>`).join('')}</ul></div>`
  ).join('');
  result.hidden = false;
  document.querySelector('#result-title').focus();
}

form.addEventListener('input', () => { result.hidden = true; });
form.addEventListener('change', () => { result.hidden = true; });
form.addEventListener('submit',async event => {
  event.preventDefault();
  result.hidden = true;
  const [a,b] = people.map(person => Object.fromEntries(Array.from(person.querySelectorAll('[name]'), field => [field.name, Number(field.value)])));
  for (const person of people) person.disabled = true;
  submit.disabled = true;
  status.textContent = '二人の天体の位置を計算しています。';
  try {
    const response = await fetch('/api/synastry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({a,b})});
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    show(data);
    status.textContent = '';
  } catch (error) {
    status.textContent = error instanceof TypeError ? '計算に接続できませんでした。起動画面を開いたまま、もう一度お試しください。' : error.message || '計算できませんでした。';
  } finally {
    for (const person of people) person.disabled = false;
    submit.disabled = false;
  }
});
