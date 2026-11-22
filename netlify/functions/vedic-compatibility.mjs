import { timingSafeEqual } from 'node:crypto';
import { calculateCompatibility } from '../../engine/lib/compatibility.mjs';

const json = (statusCode, result) => ({
  statusCode,
  headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'},
  body: JSON.stringify(result),
});

export async function handler(event) {
  const expected = Buffer.from(process.env.VEDIC_PROXY_TOKEN ?? '');
  const provided = Buffer.from(event.headers?.['x-vedic-proxy-token'] ?? '');
  if (expected.length < 32) return json(503, {error: '計算サービスの設定が必要です。'});
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return json(403, {error: 'アクセスできません。'});
  }
  if (event.httpMethod !== 'POST') return json(405, {error: 'POSTが必要です。'});
  const body = event.body ?? '';
  if (event.isBase64Encoded || Buffer.byteLength(body) > 16000 ||
      !/^application\/json(?:\s*;|$)/i.test(event.headers?.['content-type'] ?? '')) {
    return json(400, {error: '入力内容を確認してください。'});
  }
  try {
    return json(200, await calculateCompatibility(JSON.parse(body)));
  } catch (e) {
    if (e?.code === 'ENOENT' || e?.code === 'EACCES' || e?.killed) {
      return json(503, {error: '計算エンジンを利用できません。'});
    }
    return json(400, {error: '二人の入力内容を確認してください。'});
  }
}
