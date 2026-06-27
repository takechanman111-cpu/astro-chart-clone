import fs from 'node:fs';
import path from 'node:path';

function cleanText(value) {
  return String(value || '').replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function redactUrl(value) {
  return String(value || '').replace(/\/\d{6,}(?=\/|\?|$)/g, '/<redacted-chart-id>');
}

function extractTables(html) {
  return [...String(html).matchAll(/<table[\s\S]*?<\/table>/gi)].map((match, tableIndex) => {
    const rows = [...match[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((rowMatch) => {
      return [...rowMatch[0].matchAll(/<(?:th|td)[^>]*>[\s\S]*?<\/(?:th|td)>/gi)]
        .map((cellMatch) => cleanText(cellMatch[0]))
        .filter(Boolean);
    }).filter((row) => row.length);
    return { table_index: tableIndex, rows };
  }).filter((table) => table.rows.length);
}

function classifyTables(tables) {
  return tables.map((table) => {
    const header = table.rows[0]?.join(' | ') || '';
    let kind = 'unknown';
    if (/Transit Longitude/i.test(header)) kind = 'transits_and_progressions';
    else if (/Secondary/i.test(header) && /Progressed/i.test(header)) kind = 'progressions';
    else if (/Solar Return/i.test(header)) kind = 'solar_return';
    else if (/Lord of the Year|House & Sign/i.test(header)) kind = 'annual_profections';
    else if (/House/i.test(header) && /Longitude/i.test(header)) kind = 'houses';
    else if (/Aspect/i.test(header)) kind = 'aspects';
    return { ...table, kind };
  });
}

function hasUnsafeCopiedCode(text) {
  return /googletag|pagead|fundingchoices|cloudflareinsights|adsbygoogle|document\.cookie|localStorage|sessionStorage/i.test(text);
}

function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  const sourceUrl = process.argv[4] || '';
  if (!inputPath || !outputPath) {
    console.error('Usage: node extract_source_visible_tables.mjs <input-html> <output-json> [source-url]');
    process.exit(2);
  }
  const html = fs.readFileSync(inputPath, 'utf8');
  const tables = classifyTables(extractTables(html));
  const report = {
    schema: 'source-visible-tables/v1',
    created_on: '2026-06-11',
    source_url: redactUrl(sourceUrl),
    unsafe_source_code_copied: false,
    extraction_policy: 'visible table text only; scripts, styles, storage, cookies, ids, and hidden values are not copied',
    rejected_content_detected_in_input: hasUnsafeCopiedCode(html),
    tables
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({
    verdict: tables.length ? 'PASS' : 'NG',
    output_path: outputPath,
    table_count: tables.length,
    rejected_content_detected_in_input: report.rejected_content_detected_in_input
  }, null, 2));
  process.exit(tables.length ? 0 : 1);
}

main();
