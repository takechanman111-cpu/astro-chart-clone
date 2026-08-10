import fs from 'node:fs';
import path from 'node:path';
import { calculateTimingPayload } from '../../scripts/timing_server.mjs';

function firstExisting(candidates) {
  return candidates.find((candidate) => {
    try {
      return candidate && fs.existsSync(candidate);
    } catch {
      return false;
    }
  }) || null;
}

function runtimeCandidates(configuredPath, relativePaths) {
  const roots = [...new Set([
    process.env.LAMBDA_TASK_ROOT,
    process.cwd()
  ].filter(Boolean).map((root) => path.resolve(root)))];
  const candidates = [];
  if (configuredPath) {
    candidates.push(configuredPath);
    if (!path.isAbsolute(configuredPath)) {
      candidates.push(...roots.map((root) => path.join(root, configuredPath)));
    }
  }
  for (const relativePath of relativePaths) {
    candidates.push(...roots.map((root) => path.join(root, relativePath)));
  }
  return candidates;
}

function configureSwissRuntime() {
  const swetestPath = firstExisting(runtimeCandidates(
    process.env.SWETEST_PATH,
    ['netlify/swiss/swetest', 'swiss/swetest']
  ));
  const ephePath = firstExisting(runtimeCandidates(
    process.env.SWISS_EPHEMERIS_PATH,
    ['netlify/swiss/ephe', 'swiss/ephe']
  ));

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
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

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
