import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { calculateEstablishedTiming } from './established_timing_calculator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const ENGINE_MODES = new Set(['auto', 'astronomy', 'astronomy_engine', 'swiss', 'swiss_ephemeris', 'swisseph', 'swiss_ephemeris_node', 'swetest', 'swetest_cli']);

function numberInRange(value, min, max, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${label} is out of range`);
  }
  return number;
}

function intInRange(value, min, max, label) {
  const number = numberInRange(value, min, max, label);
  if (!Number.isInteger(number)) throw new Error(`${label} must be an integer`);
  return number;
}

export function sanitizeTimingPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('payload must be an object');
  const rawInput = payload.input || {};
  const rawTargetDate = payload.targetDate || payload.target_date || {};
  const input = {
    year: intInRange(rawInput.year, 1800, 2200, 'input.year'),
    month: intInRange(rawInput.month, 1, 12, 'input.month'),
    day: intInRange(rawInput.day, 1, 31, 'input.day'),
    hour: intInRange(rawInput.hour, 0, 23, 'input.hour'),
    minute: intInRange(rawInput.minute ?? 0, 0, 59, 'input.minute'),
    second: intInRange(rawInput.second ?? 0, 0, 59, 'input.second'),
    timezoneOffset: numberInRange(rawInput.timezoneOffset, -14, 14, 'input.timezoneOffset'),
    latitude: numberInRange(rawInput.latitude, -90, 90, 'input.latitude'),
    longitude: numberInRange(rawInput.longitude, -180, 180, 'input.longitude')
  };
  const targetDate = {
    year: intInRange(rawTargetDate.year, 1800, 2200, 'targetDate.year'),
    month: intInRange(rawTargetDate.month, 1, 12, 'targetDate.month'),
    day: intInRange(rawTargetDate.day, 1, 31, 'targetDate.day')
  };
  const ascLongitude = numberInRange(payload.ascLongitude ?? rawInput.ascLongitude, 0, 360, 'ascLongitude');
  const requestedMode = String(payload.engineMode || process.env.ASTRO_TIMING_ENGINE || 'auto');
  const engineMode = ENGINE_MODES.has(requestedMode) ? requestedMode : 'auto';
  return { input, targetDate, ascLongitude, engineMode };
}

export function calculateTimingPayload(payload, options = {}) {
  const sanitized = sanitizeTimingPayload(payload);
  const engineMode = options.engineMode || sanitized.engineMode;
  return calculateEstablishedTiming(
    sanitized.input,
    sanitized.targetDate,
    sanitized.ascLongitude,
    { engineMode }
  );
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(body, null, 2));
}

function publicSourceMarkup() {
  const sourceUrl = String(process.env.PUBLIC_SOURCE_URL || '').trim();
  if (!sourceUrl) return '公開準備中';
  const safeUrl = sourceUrl.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024) {
        reject(new Error('request body is too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function handleTimingApi(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }
  try {
    const body = await readRequestBody(req);
    const payload = JSON.parse(body || '{}');
    const result = calculateTimingPayload(payload);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, {
      error: 'timing_calculation_failed',
      message: String(error?.message || error)
    });
  }
}

function resolveStaticPath(urlPath) {
  const pathname = decodeURIComponent(urlPath.split('?')[0]);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const fullPath = path.resolve(appDir, relativePath);
  if (!fullPath.startsWith(appDir + path.sep) && fullPath !== appDir) {
    throw new Error('path traversal rejected');
  }
  return fullPath;
}

function serveStatic(req, res) {
  try {
    const filePath = resolveStaticPath(req.url || '/');
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) throw new Error('not a file');
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    if (path.basename(filePath) === 'index.html') {
      const html = fs.readFileSync(filePath, 'utf8')
        .replace('<span id="publicSourceUrl">公開準備中</span>', `<span id="publicSourceUrl">${publicSourceMarkup()}</span>`);
      res.end(html);
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end('Not found');
  }
}

export function createTimingServer() {
  return http.createServer((req, res) => {
    if ((req.url || '').split('?')[0] === '/healthz') {
      sendJson(res, 200, { status: 'ok', service: 'astro-chart-clone' });
      return;
    }
    if ((req.url || '').startsWith('/api/timing')) {
      handleTimingApi(req, res);
      return;
    }
    serveStatic(req, res);
  });
}

export function startTimingServer(options = {}) {
  const host = options.host || process.env.HOST || '127.0.0.1';
  const port = Number(options.port || process.env.PORT || 4173);
  const server = createTimingServer();
  server.on('error', (error) => {
    const message = error?.code === 'EPERM'
      ? `Cannot open http://${host}:${port}/ in this sandbox. Run npm start from a normal terminal to serve the app.`
      : `Timing server failed: ${String(error?.message || error)}`;
    if (options.onError) options.onError(error);
    else console.error(message);
    process.exitCode = 1;
  });
  server.listen(port, host, () => {
    console.log(`Astro timing server: http://${host}:${port}/`);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startTimingServer();
}
