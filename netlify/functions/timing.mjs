import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateTimingPayload } from '../../scripts/timing_server.mjs';

const functionDir = path.dirname(fileURLToPath(import.meta.url));

function firstExisting(candidates) {
  return candidates.find((candidate) => {
    try {
      return candidate && fs.existsSync(candidate);
    } catch {
      return false;
    }
  }) || null;
}

function configureSwissRuntime() {
  const taskRoot = process.env.LAMBDA_TASK_ROOT || '';
  const swetestPath = firstExisting([
    process.env.SWETEST_PATH,
    path.join(functionDir, '..', 'swiss', 'swetest'),
    path.join(process.cwd(), 'netlify/swiss/swetest'),
    taskRoot ? path.join(taskRoot, 'netlify/swiss/swetest') : '',
    taskRoot ? path.join(taskRoot, 'swiss/swetest') : ''
  ]);
  const ephePath = firstExisting([
    process.env.SWISS_EPHEMERIS_PATH,
    path.join(functionDir, '..', 'swiss', 'ephe'),
    path.join(process.cwd(), 'netlify/swiss/ephe'),
    taskRoot ? path.join(taskRoot, 'netlify/swiss/ephe') : '',
    taskRoot ? path.join(taskRoot, 'swiss/ephe') : ''
  ]);

  if (swetestPath) process.env.SWETEST_PATH = swetestPath;
  if (ephePath) process.env.SWISS_EPHEMERIS_PATH = ephePath;
  if (!process.env.ASTRO_TIMING_ENGINE && swetestPath) {
    process.env.ASTRO_TIMING_ENGINE = 'swetest';
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    },
    body: JSON.stringify(body)
  };
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  try {
    configureSwissRuntime();
    const payload = JSON.parse(event.body || '{}');
    const result = calculateTimingPayload(payload);
    return jsonResponse(200, result);
  } catch (error) {
    return jsonResponse(400, {
      error: 'timing_calculation_failed',
      message: String(error?.message || error)
    });
  }
}
