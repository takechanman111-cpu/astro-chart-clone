import path from 'node:path';
import { accessSync, constants } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { calculatePair } from '../../scripts/pair.mjs';

function response(statusCode, body) {
  return {statusCode, headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'
  }, body:JSON.stringify(body)};
}

export async function handler(event) {
  const secret = process.env.SYNASTRY_PROXY_TOKEN || '';
  const expected = Buffer.from(secret);
  const received = Buffer.from(event.headers?.['x-synastry-proxy-token'] || '');
  if (expected.length < 32) return response(503,{message:'計算サービスの設定を確認してください。'});
  if (received.length !== expected.length || !timingSafeEqual(received,expected)) return response(403,{message:'アクセスできません。'});
  if (event.httpMethod !== 'POST') return response(405,{message:'POSTが必要です。'});
  const body = event.body ?? '';
  if (event.isBase64Encoded || Buffer.byteLength(body) > 4096 || !/^application\/json(?:\s*;|$)/i.test(event.headers?.['content-type'] ?? '')) {
    return response(400,{message:'入力内容を確認してください。'});
  }
  try {
    const payload = JSON.parse(body);
    if (!payload || typeof payload !== 'object') return response(400,{message:'入力内容を確認してください。'});
    const runtime = path.resolve(process.env.LAMBDA_TASK_ROOT || process.cwd(),'compatibility/western/runtime');
    process.env.SWETEST_PATH = path.join(runtime,'swetest');
    process.env.SWISS_EPHEMERIS_PATH = path.join(runtime,'ephe');
    accessSync(process.env.SWETEST_PATH,constants.X_OK);
    for (const file of ['sepl_18.se1','semo_18.se1']) accessSync(path.join(runtime,'ephe',file),constants.R_OK);
    return response(200, calculatePair(payload.a,payload.b));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof RangeError) return response(400,{message:'二人の入力内容を確認してください。'});
    return response(503,{message:'天体の位置を計算できませんでした。'});
  }
}
