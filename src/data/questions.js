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

// Fisher-Yates shuffle for an unbiased random subset.
export function getRandomQuestions(count) {
  const pool = QUESTIONS.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
