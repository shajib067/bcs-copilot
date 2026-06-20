#!/usr/bin/env node
/*
 * import-csv.js
 * -------------------------------------------------------------
 * Bulk-import questions from a CSV into the bank. This is the intended
 * path to book-sized volume: digitise verified past-year BCS papers (or
 * a vetted set you have rights to) once, import, then build:bank.
 *
 * Usage:
 *   node scripts/import-csv.js <input.csv> [name]
 *   e.g. node scripts/import-csv.js data/44th-bcs.csv 44th-bcs
 *        -> writes question-bank/imported-44th-bcs.json
 *
 * CSV headers (case-insensitive, any order):
 *   category    required  one of: bangla, english, bd_affairs, intl_affairs,
 *                         geography, science, ict, math, mental, ethics
 *   question    required
 *   option_a..option_d  required  (also accepts a,b,c,d)
 *   answer      required  A/B/C/D or ক/খ/গ/ঘ or 1..4 or 0..3
 *   explanation optional
 *   difficulty  optional  easy|medium|hard
 *   subtopic, year, source  optional metadata
 *
 * Assigns stable ids (imp-<name>-<n>). Run `npm run build:bank` after;
 * that step does final validation, cross-file de-duplication and encoding.
 */
const fs = require('fs');
const path = require('path');

const VALID_CATEGORIES = new Set([
  'bangla', 'english', 'bd_affairs', 'intl_affairs', 'geography',
  'science', 'ict', 'math', 'mental', 'ethics',
]);

// RFC-4180-ish parser: handles quoted fields, commas and newlines inside quotes.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length && r.some((x) => x.trim() !== ''));
}

function normHeader(h) {
  return h.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

const ANSWER_MAP = {
  a: 0, b: 1, c: 2, d: 3,
  '\u0995': 0, '\u0996': 1, '\u0997': 2, '\u0998': 3, // ক খ গ ঘ
  '1': 0, '2': 1, '3': 2, '4': 3,
  '0': 0,
};

function resolveAnswer(raw) {
  const v = String(raw).trim().toLowerCase();
  if (v in ANSWER_MAP) return ANSWER_MAP[v];
  const n = Number(v);
  if (Number.isInteger(n)) {
    if (n >= 0 && n <= 3) return n;
    if (n >= 1 && n <= 4) return n - 1;
  }
  return -1;
}

function col(map, row, ...names) {
  for (const n of names) if (map[n] != null) return (row[map[n]] || '').trim();
  return '';
}

function main() {
  const [, , input, nameArg] = process.argv;
  if (!input) {
    console.error('Usage: node scripts/import-csv.js <input.csv> [name]');
    process.exit(1);
  }
  if (!fs.existsSync(input)) { console.error('File not found:', input); process.exit(1); }

  const name = (nameArg || path.basename(input).replace(/\.csv$/i, '')).replace(/[^a-z0-9_-]+/gi, '-');
  const rows = parseCSV(fs.readFileSync(input, 'utf8'));
  if (rows.length < 2) { console.error('CSV has no data rows'); process.exit(1); }

  const headerMap = {};
  rows[0].forEach((h, i) => (headerMap[normHeader(h)] = i));

  const out = [];
  const errors = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const category = col(headerMap, row, 'category', 'categoryid').trim();
    const question = col(headerMap, row, 'question');
    const options = [
      col(headerMap, row, 'option_a', 'a', 'opt_a'),
      col(headerMap, row, 'option_b', 'b', 'opt_b'),
      col(headerMap, row, 'option_c', 'c', 'opt_c'),
      col(headerMap, row, 'option_d', 'd', 'opt_d'),
    ];
    const answerIndex = resolveAnswer(col(headerMap, row, 'answer', 'correct', 'ans'));

    const rowErr = [];
    if (!VALID_CATEGORIES.has(category)) rowErr.push(`bad category "${category}"`);
    if (!question) rowErr.push('empty question');
    if (options.some((o) => !o)) rowErr.push('missing option(s)');
    if (new Set(options.map((o) => o.trim().toLowerCase())).size !== 4) rowErr.push('options not distinct');
    if (answerIndex < 0) rowErr.push('unrecognised answer');
    if (rowErr.length) { errors.push(`  row ${r + 1}: ${rowErr.join('; ')}`); continue; }

    const item = { id: `imp-${name}-${out.length + 1}`, categoryId: category, question, options, answerIndex };
    const explanation = col(headerMap, row, 'explanation', 'explain');
    if (explanation) item.explanation = explanation;
    const difficulty = col(headerMap, row, 'difficulty').toLowerCase();
    if (['easy', 'medium', 'hard'].includes(difficulty)) item.difficulty = difficulty;
    const subTopic = col(headerMap, row, 'subtopic', 'topic');
    if (subTopic) item.subTopic = subTopic;
    const year = col(headerMap, row, 'year');
    if (year) item.year = year;
    const source = col(headerMap, row, 'source');
    if (source) item.source = source;
    out.push(item);
  }

  const outFile = path.join(__dirname, '..', 'question-bank', `imported-${name}.json`);
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`Imported ${out.length} questions -> question-bank/imported-${name}.json`);
  if (errors.length) {
    console.log(`\nSkipped ${errors.length} row(s) with problems:`);
    errors.slice(0, 30).forEach((e) => console.log(e));
    if (errors.length > 30) console.log(`  ...and ${errors.length - 30} more`);
  }
  console.log('\nNext: npm run build:bank  (validates, de-dupes and encodes everything)');
}

main();
