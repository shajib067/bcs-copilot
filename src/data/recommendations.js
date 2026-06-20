// Weak-area analysis + study recommendations.
//
// Pure functions (no storage/UI imports) so they're easy to reuse and test.
// Two inputs are supported:
//   • a single mock test's `review` array  -> per-test breakdown
//   • the stored cumulative `categoryStats` -> long-term weak areas
import { CATEGORIES, getCategoryById } from './categories';

// A category is considered "weak" below this accuracy, and we only judge
// it once there's enough signal (attempts) to be fair.
const WEAK_THRESHOLD = 60; // percent
const STRONG_THRESHOLD = 80; // percent
const MIN_ATTEMPTS = 3;

function pct(correct, total) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

// ---- From a single mock test review ([{ q, picked, isCorrect }]) ----
export function perCategoryFromReview(review) {
  const map = {};
  for (const item of review) {
    const cid = item.q.categoryId;
    if (!map[cid]) map[cid] = { categoryId: cid, total: 0, correct: 0, wrong: 0, skipped: 0 };
    map[cid].total += 1;
    if (item.picked === null || item.picked === undefined) map[cid].skipped += 1;
    else if (item.isCorrect) map[cid].correct += 1;
    else map[cid].wrong += 1;
  }
  return finalize(map);
}

// ---- From cumulative stored stats ({ [categoryId]: {correct, wrong} }) ----
export function perCategoryFromStats(categoryStats) {
  const map = {};
  for (const cid in categoryStats) {
    const s = categoryStats[cid];
    const correct = s.correct || 0;
    const wrong = s.wrong || 0;
    map[cid] = { categoryId: cid, total: correct + wrong, correct, wrong, skipped: 0 };
  }
  return finalize(map);
}

function finalize(map) {
  return Object.values(map)
    .map((row) => {
      const cat = getCategoryById(row.categoryId);
      const attempted = row.correct + row.wrong;
      return {
        ...row,
        name: cat?.name ?? row.categoryId,
        nameEn: cat?.nameEn ?? row.categoryId,
        color: cat?.color ?? '#6B7280',
        accuracy: pct(row.correct, attempted),
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);
}

// Returns the categories that need work, most urgent first.
export function getWeakAreas(perCategory, { threshold = WEAK_THRESHOLD, minAttempts = MIN_ATTEMPTS } = {}) {
  return perCategory
    .filter((c) => c.correct + c.wrong >= minAttempts && c.accuracy < threshold)
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function getStrongAreas(perCategory, { threshold = STRONG_THRESHOLD, minAttempts = MIN_ATTEMPTS } = {}) {
  return perCategory
    .filter((c) => c.correct + c.wrong >= minAttempts && c.accuracy >= threshold)
    .sort((a, b) => b.accuracy - a.accuracy);
}

// Bilingual, friendly guidance derived from the weak areas.
// Returns [{ categoryId, name, accuracy, tip }] ready to render.
export function buildRecommendations(perCategory, opts = {}) {
  const weak = getWeakAreas(perCategory, opts);
  return weak.map((c) => ({
    categoryId: c.categoryId,
    name: c.name,
    nameEn: c.nameEn,
    color: c.color,
    accuracy: c.accuracy,
    tip: tipFor(c),
  }));
}

function tipFor(c) {
  const isEnglish = c.categoryId === 'english';
  if (isEnglish) {
    return `Your accuracy here is ${c.accuracy}%. Revise the core rules and practice this topic daily until you cross 70%.`;
  }
  return `এই বিষয়ে আপনার নির্ভুলতা ${toBn(c.accuracy)}%। প্রতিদিন এই বিষয়ে অনুশীলন করুন এবং ভুল প্রশ্নগুলো রিভিউ করুন।`;
}

// One-line headline summarising overall state.
export function headline(perCategory, opts = {}) {
  const tested = perCategory.filter((c) => c.correct + c.wrong >= (opts.minAttempts ?? MIN_ATTEMPTS));
  if (tested.length === 0) {
    return {
      bn: 'আরও কিছু প্রশ্ন অনুশীলন করলে আপনার দুর্বল বিষয়গুলো এখানে দেখাবে।',
      en: 'Practice a few more questions to unlock personalised recommendations.',
    };
  }
  const weak = getWeakAreas(perCategory, opts);
  if (weak.length === 0) {
    return {
      bn: 'দারুণ! সব বিষয়েই আপনি ভালো করছেন। ধারাবাহিকতা ধরে রাখুন।',
      en: 'Great balance across topics — keep up the consistency!',
    };
  }
  const names = weak.slice(0, 3).map((c) => c.name).join(', ');
  return {
    bn: `বেশি মনোযোগ দিন: ${names}।`,
    en: `Focus more on: ${weak.slice(0, 3).map((c) => c.nameEn).join(', ')}.`,
  };
}

// Helper: render numbers in Bengali digits for nicer UI copy.
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export function toBn(n) {
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[+d]);
}

// Categories that haven't been practised at all yet (gentle nudge).
export function untouchedCategories(perCategory) {
  const seen = new Set(perCategory.map((c) => c.categoryId));
  return CATEGORIES.filter((c) => !seen.has(c.id));
}
