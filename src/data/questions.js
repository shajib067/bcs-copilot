// Runtime loader for the question bank.
//
// The questions ship as a compressed, base64-encoded blob in
// bank.generated.js (built from /question-bank/*.json by
// scripts/build-bank.js). They are decoded in-memory on first access,
// so the readable question/answer data never sits in the JS bundle as
// plain text and the payload stays small.
//
// Public API (unchanged, so all screens keep working):
//   QUESTIONS                  -> array of all questions
//   getQuestionsByCategory(id) -> questions for one category
//   getRandomQuestions(count)  -> shuffled subset
import { inflate } from 'pako';
import { ENCODED_BANK } from './bank.generated';
import { CATEGORIES, TOTAL_MARKS } from './categories';

// Base64 -> Uint8Array. Implemented directly so we don't depend on
// atob/Buffer being present in the JS engine (e.g. Hermes).
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = (() => {
  const t = new Uint8Array(256);
  for (let i = 0; i < B64.length; i++) t[B64.charCodeAt(i)] = i;
  return t;
})();

function base64ToBytes(b64) {
  let len = b64.length;
  if (b64[len - 1] === '=') len--;
  if (b64[len - 1] === '=') len--;
  const byteLen = (len * 3) >> 2;
  const bytes = new Uint8Array(byteLen);
  let p = 0;
  for (let i = 0; i < b64.length; i += 4) {
    const e0 = LOOKUP[b64.charCodeAt(i)];
    const e1 = LOOKUP[b64.charCodeAt(i + 1)];
    const e2 = LOOKUP[b64.charCodeAt(i + 2)];
    const e3 = LOOKUP[b64.charCodeAt(i + 3)];
    if (p < byteLen) bytes[p++] = (e0 << 2) | (e1 >> 4);
    if (p < byteLen) bytes[p++] = ((e1 & 15) << 4) | (e2 >> 2);
    if (p < byteLen) bytes[p++] = ((e2 & 3) << 6) | e3;
  }
  return bytes;
}

let _cache = null;

function loadQuestions() {
  if (_cache) return _cache;
  try {
    const bytes = base64ToBytes(ENCODED_BANK);
    const json = inflate(bytes, { to: 'string' });
    _cache = JSON.parse(json);
  } catch (e) {
    console.error('Failed to decode question bank:', e);
    _cache = [];
  }
  return _cache;
}

export const QUESTIONS = loadQuestions();

export function getQuestionsByCategory(categoryId) {
  return QUESTIONS.filter((q) => q.categoryId === categoryId);
}

// A random practice session of up to `count` questions from one category.
export function getCategorySession(categoryId, count) {
  return sample(getQuestionsByCategory(categoryId), count);
}

// Distinct previous-year exams present in the bank, with question counts.
export function getPreviousYearExams() {
  const map = new Map();
  for (const q of QUESTIONS) {
    if (q.source && q.year) {
      const e = map.get(q.year) || { year: q.year, source: q.source, count: 0 };
      e.count += 1;
      map.set(q.year, e);
    }
  }
  return [...map.values()].sort((a, b) => b.year - a.year);
}

// A practice session of previous-year questions: a specific year, or 'all'.
export function getPreviousYearSession(yearOrAll, count) {
  const pool = QUESTIONS.filter(
    (q) => q.source && q.year && (yearOrAll === 'all' || q.year === yearOrAll)
  );
  return sample(pool, count || pool.length);
}

// Fisher-Yates shuffle for an unbiased random subset.
export function getRandomQuestions(count) {
  const pool = QUESTIONS.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

function sample(arr, n) {
  const pool = arr.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}

// Build a mock test that mirrors the real BCS mark distribution
// (e.g. ~35% language, ~7.5% math), instead of sampling uniformly —
// so a large computed-math set doesn't distort the exam balance.
export function getMockTestQuestions(count = 100) {
  const byCat = {};
  for (const q of QUESTIONS) (byCat[q.categoryId] = byCat[q.categoryId] || []).push(q);

  // Target per category, proportional to marks; largest-remainder rounding.
  const targets = CATEGORIES.map((c) => {
    const exact = (count * c.marks) / TOTAL_MARKS;
    return { id: c.id, exact, base: Math.floor(exact), frac: exact - Math.floor(exact) };
  });
  let assigned = targets.reduce((s, t) => s + t.base, 0);
  targets.sort((a, b) => b.frac - a.frac);
  for (let i = 0; assigned < count && i < targets.length; i++, assigned++) targets[i].base += 1;

  let picked = [];
  let shortfall = 0;
  for (const t of targets) {
    const pool = byCat[t.id] || [];
    const take = sample(pool, t.base);
    picked = picked.concat(take);
    shortfall += t.base - take.length; // category didn't have enough
  }
  // Backfill any shortfall from the remaining unused questions.
  if (shortfall > 0) {
    const usedIds = new Set(picked.map((q) => q.id));
    const rest = QUESTIONS.filter((q) => !usedIds.has(q.id));
    picked = picked.concat(sample(rest, shortfall));
  }
  return sample(picked, picked.length); // final shuffle
}
