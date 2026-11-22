import { calculate } from '../../engine/lib/service.mjs';

const json = (statusCode, result) => ({
  statusCode,
  headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'},
  body: JSON.stringify(result),
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, {error: 'POSTが必要です。'});
  const body = event.body ?? '';
  if (event.isBase64Encoded || Buffer.byteLength(body) > 16000 ||
      !/^application\/json(?:\s*;|$)/i.test(event.headers?.['content-type'] ?? '')) {
    return json(400, {error: '入力内容を確認してください。'});
  }
  try {
    return json(200, await calculate(JSON.parse(body)));
  } catch (e) {
    if (e?.code === 'ENOENT' || e?.code === 'EACCES' || e?.killed) {
      return json(503, {error: '計算エンジンを利用できません。'});
    }
    return json(400, {error: '二人の入力内容を確認してください。'});
  }
}
