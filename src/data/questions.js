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
import { FREE_QUESTIONS_PER_CATEGORY } from '../monetization/config';

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
export function getCategorySession(categoryId, count, { freeOnly = false } = {}) {
  let pool = getQuestionsByCategory(categoryId);
  if (freeOnly) pool = pool.filter((q) => FREE_QUESTION_IDS.has(q.id));
  return sample(pool, count);
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

// Resolve a list/Set of ids to question objects (order follows the bank).
export function getQuestionsByIds(ids) {
  const set = ids instanceof Set ? ids : new Set(ids);
  return QUESTIONS.filter((q) => set.has(q.id));
}

// ---- Free access pool -------------------------------------------------------
// A fixed, capped set of question ids that free users may access. Enforced
// across practice, mocks, search and saved so answers can't leak.
function buildFreeIds() {
  const ids = new Set();
  const perCat = {};
  // First N original (non-previous-year) questions of each category.
  for (const q of QUESTIONS) {
    if (q.year) continue;
    perCat[q.categoryId] = perCat[q.categoryId] || 0;
    if (perCat[q.categoryId] < FREE_QUESTIONS_PER_CATEGORY) {
      ids.add(q.id);
      perCat[q.categoryId] += 1;
    }
  }
  // Plus the most recent previous-year exam, as a free taste.
  const exams = getPreviousYearExams();
  if (exams.length) {
    const freeYear = exams[0].year;
    for (const q of QUESTIONS) if (q.year === freeYear) ids.add(q.id);
  }
  return ids;
}
export const FREE_QUESTION_IDS = buildFreeIds();
export function isFreeQuestion(id) {
  return FREE_QUESTION_IDS.has(id);
}
export function getFreeQuestionCount() {
  return FREE_QUESTION_IDS.size;
}
export function getFreeCategoryCount(categoryId) {
  return getQuestionsByCategory(categoryId).filter((q) => FREE_QUESTION_IDS.has(q.id)).length;
}

// A practice session drawn from the user's weakest categories.
export function getWeakAreaSession(categoryIds, count = 20, { freeOnly = false } = {}) {
  const ids = new Set(categoryIds);
  let pool = QUESTIONS.filter((q) => ids.has(q.categoryId));
  if (freeOnly) pool = pool.filter((q) => FREE_QUESTION_IDS.has(q.id));
  return sample(pool, count);
}

// Deterministic daily challenge: same questions all day, new set each day,
// fully offline (seeded by the date). Free users draw from the free pool.
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function getDailyChallenge(dateStr, count = 20, { freeOnly = false } = {}) {
  const pool = (freeOnly ? QUESTIONS.filter((q) => FREE_QUESTION_IDS.has(q.id)) : QUESTIONS).slice();
  const seed = (Number(String(dateStr).replace(/-/g, '')) || 1) + (freeOnly ? 101 : 202);
  const rng = mulberry32(seed);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

// Offline keyword search across question text, options, explanation, subtopic.
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
function normalizeDigits(s) {
  return s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}
export function searchQuestions(query, limit = 40) {
  const q = normalizeDigits(String(query || '').trim().toLowerCase());
  if (q.length < 2) return [];
  const out = [];
  for (const item of QUESTIONS) {
    const hay = normalizeDigits(
      (
        item.question +
        ' ' +
        item.options.join(' ') +
        ' ' +
        (item.explanation || '') +
        ' ' +
        (item.subTopic || '') +
        ' ' +
        (item.source || '')
      ).toLowerCase()
    );
    if (hay.includes(q)) {
      out.push(item);
      if (out.length >= limit) break;
    }
  }
  return out;
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
export function getMockTestQuestions(count = 100, { freeOnly = false } = {}) {
  const source = freeOnly ? QUESTIONS.filter((q) => FREE_QUESTION_IDS.has(q.id)) : QUESTIONS;
  const byCat = {};
  for (const q of source) (byCat[q.categoryId] = byCat[q.categoryId] || []).push(q);

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
    const rest = source.filter((q) => !usedIds.has(q.id));
    picked = picked.concat(sample(rest, shortfall));
  }
  return sample(picked, picked.length); // final shuffle
}
