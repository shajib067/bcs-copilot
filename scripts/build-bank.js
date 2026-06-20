#!/usr/bin/env node
/*
 * build-bank.js
 * -------------------------------------------------------------
 * Reads the human-readable question sources in /question-bank,
 * validates them, then compresses (deflate) + base64-encodes the
 * whole set into src/data/bank.generated.js.
 *
 * Only the generated (encoded) file is imported by the app, so the
 * readable source JSON never ends up in the shipped bundle.
 *
 * Question schema (per item):
 *   id          string   (required, unique)
 *   categoryId  string   (required, one of the 10 BCS categories)
 *   question    string   (required)
 *   options     string[] (required, exactly 4, all distinct)
 *   answerIndex number   (required, 0-3)
 *   explanation string   (optional)
 *   difficulty  string   (optional: easy | medium | hard)
 *   subTopic    string   (optional, e.g. "literature", "grammar")
 *   tags        string[] (optional)
 *   year        number|string (optional, e.g. 44 for 44th BCS)
 *   source      string   (optional, e.g. "44th BCS")
 *
 * Run with:  npm run build:bank
 */
const fs = require('fs');
const path = require('path');
const pako = require('pako');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'question-bank');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'bank.generated.js');

const VALID_CATEGORIES = new Set([
  'bangla', 'english', 'bd_affairs', 'intl_affairs', 'geography',
  'science', 'ict', 'math', 'mental', 'ethics',
]);
const VALID_DIFFICULTY = new Set(['easy', 'medium', 'hard']);

function loadSources() {
  if (!fs.existsSync(SRC_DIR)) throw new Error(`Source folder not found: ${SRC_DIR}`);
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.json')).sort();
  if (files.length === 0) throw new Error('No .json source files found in question-bank/');
  let all = [];
  for (const file of files) {
    const full = path.join(SRC_DIR, file);
    let arr;
    try { arr = JSON.parse(fs.readFileSync(full, 'utf8')); }
    catch (e) { throw new Error(`Invalid JSON in ${file}: ${e.message}`); }
    if (!Array.isArray(arr)) throw new Error(`${file} must contain a JSON array`);
    console.log(`  • ${file}: ${arr.length} questions`);
    arr.forEach((q) => { if (q && typeof q === 'object') q._file = file; });
    all = all.concat(arr);
  }
  return all;
}

function normText(s) {
  return String(s || '')
    .replace(/[\s\u00a0]+/g, ' ')
    .replace(/["'\u201c\u201d\u2018\u2019.,?!:;()\-\u2014_]/g, '')
    .trim()
    .toLowerCase();
}

function validate(questions) {
  const ids = new Set();
  const seenText = new Map();
  const errors = [];
  const byCategory = {};
  const bySubTopic = {};

  questions.forEach((q, i) => {
    const where = `${q && q._file ? q._file + ' ' : ''}#${i}${q && q.id ? ` (id=${q.id})` : ''}`;
    if (!q || typeof q !== 'object') return errors.push(`${where}: not an object`);
    if (!q.id) errors.push(`${where}: missing id`);
    else if (ids.has(q.id)) errors.push(`${where}: duplicate id "${q.id}"`);
    ids.add(q.id);
    if (!VALID_CATEGORIES.has(q.categoryId)) errors.push(`${where}: unknown categoryId "${q.categoryId}"`);
    if (typeof q.question !== 'string' || !q.question.trim()) errors.push(`${where}: empty question`);
    if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${where}: must have exactly 4 options`);
    else if (new Set(q.options.map((o) => String(o).replace(/\s+/g, ' ').trim().toLowerCase())).size !== 4) errors.push(`${where}: options must be distinct`);
    if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex > 3) errors.push(`${where}: answerIndex must be 0-3`);
    if (q.difficulty != null && !VALID_DIFFICULTY.has(q.difficulty)) errors.push(`${where}: bad difficulty`);
    if (q.tags != null && !Array.isArray(q.tags)) errors.push(`${where}: tags must be an array`);
    if (typeof q.question === 'string') {
      const key = q.categoryId + '|' + normText(q.question);
      if (seenText.has(key)) errors.push(`${where}: duplicate question of "${seenText.get(key)}"`);
      else seenText.set(key, q.id);
    }
    byCategory[q.categoryId] = (byCategory[q.categoryId] || 0) + 1;
    if (q.subTopic) { const k = q.categoryId + ' / ' + q.subTopic; bySubTopic[k] = (bySubTopic[k] || 0) + 1; }
  });

  if (errors.length) {
    console.error('\nValidation failed:');
    errors.slice(0, 50).forEach((e) => console.error('  x ' + e));
    if (errors.length > 50) console.error(`  ...and ${errors.length - 50} more`);
    throw new Error(`${errors.length} validation error(s)`);
  }
  return { byCategory, bySubTopic };
}

function encode(questions) {
  const slim = questions.map((q) => {
    const out = {
      id: q.id, categoryId: q.categoryId, question: q.question,
      options: q.options, answerIndex: q.answerIndex, explanation: q.explanation || '',
    };
    if (q.subTopic) out.subTopic = q.subTopic;
    return out;
  });
  const json = JSON.stringify(slim);
  const b64 = Buffer.from(pako.deflate(json)).toString('base64');
  return { b64, rawBytes: Buffer.byteLength(json, 'utf8'), encBytes: b64.length };
}

function main() {
  console.log('Building question bank...');
  const questions = loadSources();
  const { byCategory, bySubTopic } = validate(questions);
  const { b64, rawBytes, encBytes } = encode(questions);
  const banner =
    '// AUTO-GENERATED by scripts/build-bank.js - DO NOT EDIT BY HAND.\n' +
    '// Source of truth lives in /question-bank/*.json (not shipped in the bundle).\n' +
    `// ${questions.length} questions. Regenerate with: npm run build:bank\n`;
  fs.writeFileSync(OUT_FILE, banner + `export const ENCODED_BANK =\n  '${b64}';\n`, 'utf8');
  const pct = ((1 - encBytes / rawBytes) * 100).toFixed(1);
  console.log('\nBy category:');
  Object.entries(byCategory).sort().forEach(([c, n]) => console.log(`  ${c.padEnd(14)} ${n}`));
  const subs = Object.entries(bySubTopic).sort();
  if (subs.length) { console.log('\nBy sub-topic:'); subs.forEach(([k, n]) => console.log(`  ${k.padEnd(28)} ${n}`)); }
  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}\n  ${questions.length} questions | raw ${(rawBytes/1024).toFixed(1)} KB -> encoded ${(encBytes/1024).toFixed(1)} KB (${pct}% smaller)`);
}

main();
