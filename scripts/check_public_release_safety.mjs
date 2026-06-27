import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');

const ignoredDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.cache'
]);

const ignoredPathPrefixes = [
  'vendor/swiss-ephemeris/',
  'vendor/swiss-ephemeris-netlify-src/',
  'netlify/swiss/'
];

const ignoredFiles = new Set([
  'vendor/astronomy-engine/astronomy.js',
  'vendor/astronomy-engine/astronomy.cjs'
]);

const requiredFiles = [
  '.gitignore',
  '.env.example',
  'SECURITY.md',
  'PRIVACY.md',
  'NOTICE.md',
  'AGPL_SWISS_EPHEMERIS_PLAN.md',
  'PUBLICATION_CHECKLIST.md'
];

const forbiddenPathNames = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development'
];

const secretPatterns = [
  { id: 'private_key', pattern: /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/ },
  { id: 'openai_key', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { id: 'github_token', pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/ },
  { id: 'slack_token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  { id: 'aws_access_key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'database_url_with_password', pattern: /\b(?:postgres|mysql|mongodb)(?:\+srv)?:\/\/[^:\s]+:[^@\s]+@/i },
  { id: 'raw_astrology_readings_chart_id', pattern: /astrologyreadings\.online\/(?:transits-progression|solar-return|time-lords)\/[0-9]{7,}\b/i },
  { id: 'browser_storage_or_cookie', pattern: /\b(?:document\.cookie|localStorage|sessionStorage)\b/ }
];

function shouldApplyRule(ruleId, filePath) {
  if (ruleId !== 'browser_storage_or_cookie') return true;
  if (filePath.endsWith('.md')) return false;
  if (filePath.startsWith('scripts/')) return false;
  return filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.mjs');
}

function walk(dir, relativeBase = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = path.join(relativeBase, entry.name);
    const normalizedRel = rel.split(path.sep).join('/');
    if (ignoredPathPrefixes.some((prefix) => `${normalizedRel}/`.startsWith(prefix))) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) files.push(...walk(full, rel));
      continue;
    }
    files.push(rel);
  }
  return files;
}

function isTextLike(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return [
    '.html', '.js', '.mjs', '.json', '.md', '.txt', '.css',
    '.example', '.gitignore', ''
  ].includes(ext);
}

function readMaybe(filePath) {
  const full = path.join(appDir, filePath);
  let stat;
  try {
    stat = fs.lstatSync(full);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
  if (stat.isSymbolicLink()) return null;
  if (stat.size > 1024 * 1024) return null;
  if (!isTextLike(filePath)) return null;
  return fs.readFileSync(full, 'utf8');
}

const files = walk(appDir).sort();
const issues = [];
const warnings = [];

function checkedDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

for (const required of requiredFiles) {
  if (!fs.existsSync(path.join(appDir, required))) {
    issues.push({ type: 'missing_required_file', file: required });
  }
}

for (const forbidden of forbiddenPathNames) {
  if (fs.existsSync(path.join(appDir, forbidden))) {
    issues.push({ type: 'forbidden_private_file', file: forbidden });
  }
}

const gitignore = fs.existsSync(path.join(appDir, '.gitignore'))
  ? fs.readFileSync(path.join(appDir, '.gitignore'), 'utf8')
  : '';
['.env', '.env.*', 'user-data/', 'birth-data/'].forEach((entry) => {
  if (!gitignore.includes(entry)) {
    issues.push({ type: 'gitignore_missing_entry', entry });
  }
});

for (const file of files) {
  const normalized = file.split(path.sep).join('/');
  if (ignoredFiles.has(normalized)) continue;
  const content = readMaybe(file);
  if (content == null) continue;

  for (const rule of secretPatterns) {
    if (!shouldApplyRule(rule.id, normalized)) continue;
    if (rule.pattern.test(content)) {
      issues.push({ type: 'secret_or_private_pattern', rule: rule.id, file: normalized });
    }
  }
}

const indexPath = path.join(appDir, 'index.html');
if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('id="sourceNotice"')) {
    issues.push({ type: 'missing_visible_source_notice', file: 'index.html' });
  }
  if (html.includes('PUBLIC_SOURCE_URL')) {
    warnings.push({ type: 'source_url_placeholder_still_present', file: 'index.html' });
  }
}

const report = {
  schema: 'public-release-safety-gate/v1',
  checked_on: checkedDate(),
  verdict: issues.length ? 'NG' : 'PASS',
  scanned_file_count: files.length,
  ignored_large_vendor_files: Array.from(ignoredFiles),
  issues,
  warnings
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.verdict === 'PASS' ? 0 : 1);
