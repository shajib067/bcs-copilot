#!/usr/bin/env node
/*
 * gen-quant.js
 * -------------------------------------------------------------
 * Generates QUANTITATIVE / reasoning questions whose answers are
 * *computed in code*, so they're correct by construction — no
 * factual-recall risk. Safe way to add real volume to the bank.
 *
 * Deterministic (fixed seed) so rebuilds produce identical output and
 * git diffs stay clean. Writes question-bank/generated-quant.json,
 * which then flows through the normal build:bank pipeline.
 *
 * Run:  npm run gen:quant   (then npm run build:bank)
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'question-bank', 'generated-quant.json');
const SEED = 73108921;
const PER_TEMPLATE = 16;

// deterministic RNG (mulberry32)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const choice = (arr) => arr[Math.floor(rng() * arr.length)];

const BN = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const bn = (n) => String(n).replace(/[0-9]/g, (d) => BN[+d]);

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a 4-option MCQ from a numeric answer + distractor candidates.
// Returns { options: string[4], answerIndex } with rendered strings.
function buildMCQ(answer, candidates, render = bn) {
  const opts = new Set([answer]);
  for (const c of shuffle(candidates)) {
    if (opts.size >= 4) break;
    if (Number.isFinite(c) && c > 0 && c !== answer) opts.add(c);
  }
  let bump = 1;
  while (opts.size < 4) {
    const cand = answer + bump;
    if (cand > 0) opts.add(cand);
    bump = bump > 0 ? -bump : -bump + 1;
    if (Math.abs(bump) > 50) break;
  }
  const arr = shuffle([...opts].slice(0, 4)).map(render);
  return { options: arr, answerIndex: arr.indexOf(render(answer)) };
}

const out = [];
let counter = 0;
function add(categoryId, subTopic, question, mcq, explanation) {
  if (mcq.answerIndex < 0 || new Set(mcq.options).size !== 4) return; // skip degenerate
  out.push({
    id: `gq-${++counter}`,
    categoryId,
    subTopic,
    difficulty: 'medium',
    question,
    options: mcq.options,
    answerIndex: mcq.answerIndex,
    explanation,
  });
}

function times(fn) { for (let i = 0; i < PER_TEMPLATE; i++) fn(); }

// 1) X% of N
times(() => {
  const p = choice([5, 10, 15, 20, 25, 40, 50]);
  const n = randInt(2, 20) * 20;
  const ans = (n * p) / 100;
  add('math', 'percentage', `${bn(n)}-এর ${bn(p)}% কত?`,
    buildMCQ(ans, [ans + 5, ans - 5, ans * 2, ans + 10, Math.round(ans * 1.5)]),
    `${bn(n)} × ${bn(p)}/১০০ = ${bn(ans)}।`);
});

// 2) find number from percent
times(() => {
  const p = choice([10, 20, 25, 40, 50]);
  const n = randInt(2, 20) * 10;
  const v = (n * p) / 100;
  add('math', 'percentage', `একটি সংখ্যার ${bn(p)}% যদি ${bn(v)} হয়, সংখ্যাটি কত?`,
    buildMCQ(n, [n + 10, n - 10, n * 2, Math.round(n / 2), n + 20]),
    `সংখ্যা = ${bn(v)} ÷ ${bn(p)}% = ${bn(n)}।`);
});

// 3) average of numbers
times(() => {
  const k = choice([3, 4, 5]);
  const base = randInt(2, 25);
  const nums = Array.from({ length: k }, () => base + randInt(0, 12));
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum % k !== 0) return;
  const ans = sum / k;
  add('math', 'average', `${nums.map(bn).join(', ')} — এই সংখ্যাগুলোর গড় কত?`,
    buildMCQ(ans, [ans + 1, ans - 1, ans + 2, ans - 2, sum]),
    `গড় = (${nums.map(bn).join(' + ')}) ÷ ${bn(k)} = ${bn(sum)} ÷ ${bn(k)} = ${bn(ans)}।`);
});

// 4) ratio division — largest share
times(() => {
  const r = shuffle([1, 2, 3, 4, 5]).slice(0, 3);
  const unit = randInt(2, 12) * 10;
  const total = unit * (r[0] + r[1] + r[2]);
  const max = Math.max(...r);
  const ans = unit * max;
  add('math', 'ratio', `${bn(total)} টাকা ${r.map(bn).join(' : ')} অনুপাতে ভাগ করলে বৃহত্তম ভাগ কত?`,
    buildMCQ(ans, [unit * Math.min(...r), ans + unit, ans - unit, total - ans]),
    `মোট অংশ ${bn(r[0] + r[1] + r[2])}; বৃহত্তম ভাগ = ${bn(max)}/${bn(r[0] + r[1] + r[2])} × ${bn(total)} = ${bn(ans)}।`);
});

// 5) profit %: find SP
times(() => {
  const cp = randInt(2, 20) * 50;
  const p = choice([5, 10, 20, 25]);
  const ans = cp + (cp * p) / 100;
  add('math', 'profit_loss', `${bn(cp)} টাকায় কেনা একটি দ্রব্য ${bn(p)}% লাভে বিক্রি করলে বিক্রয়মূল্য কত?`,
    buildMCQ(ans, [cp, cp - (cp * p) / 100, ans + 50, ans - 50]),
    `বিক্রয়মূল্য = ${bn(cp)} × (১ + ${bn(p)}/১০০) = ${bn(ans)} টাকা।`);
});

// 6) simple interest
times(() => {
  const pr = randInt(2, 20) * 100;
  const r = choice([4, 5, 6, 8, 10]);
  const t = randInt(2, 5);
  const ans = (pr * r * t) / 100;
  add('math', 'interest', `${bn(pr)} টাকার ${bn(r)}% হারে ${bn(t)} বছরের সরল সুদ কত?`,
    buildMCQ(ans, [ans + 100, ans - 100, pr, ans * 2]),
    `সরল সুদ = (${bn(pr)} × ${bn(r)} × ${bn(t)}) ÷ ১০০ = ${bn(ans)} টাকা।`);
});

// 7) arithmetic series next term
times(() => {
  const a = randInt(1, 12);
  const d = randInt(2, 9);
  const seq = [a, a + d, a + 2 * d, a + 3 * d];
  const ans = a + 4 * d;
  add('math', 'series', `ধারা: ${seq.map(bn).join(', ')}, ? — পরবর্তী সংখ্যা কত?`,
    buildMCQ(ans, [ans + d, ans - d, ans + 1, ans - 2]),
    `ধারাটির সাধারণ অন্তর ${bn(d)}; পরবর্তী পদ = ${bn(seq[3])} + ${bn(d)} = ${bn(ans)}।`);
});

// 8) geometric series next term
times(() => {
  const a = randInt(1, 5);
  const r = choice([2, 3]);
  const seq = [a, a * r, a * r * r, a * r * r * r];
  const ans = a * r ** 4;
  add('math', 'series', `ধারা: ${seq.map(bn).join(', ')}, ? — পরবর্তী সংখ্যা কত?`,
    buildMCQ(ans, [ans + seq[3], ans - seq[3], seq[3] * (r + 1), ans + r]),
    `প্রতিটি পদ পূর্ববর্তীর ${bn(r)} গুণ; পরবর্তী পদ = ${bn(seq[3])} × ${bn(r)} = ${bn(ans)}।`);
});

// 9) squares series
times(() => {
  const start = randInt(1, 6);
  const seq = [start, start + 1, start + 2, start + 3].map((x) => x * x);
  const ans = (start + 4) * (start + 4);
  add('math', 'series', `ধারা: ${seq.map(bn).join(', ')}, ? — পরবর্তী সংখ্যা কত?`,
    buildMCQ(ans, [ans + 1, ans - 1, (start + 4) * 2, ans + (start + 4)]),
    `এগুলো পূর্ণবর্গ; পরবর্তী পদ = ${bn(start + 4)}² = ${bn(ans)}।`);
});

// 10) work — men & days
times(() => {
  const m1 = randInt(4, 12);
  const d1 = randInt(6, 20);
  const work = m1 * d1;
  // pick m2 dividing work
  const divisors = [];
  for (let m = 2; m <= work; m++) if (work % m === 0 && m !== m1 && work / m <= 40) divisors.push(m);
  if (!divisors.length) return;
  const m2 = choice(divisors);
  const ans = work / m2;
  add('math', 'work', `${bn(m1)} জন লোক একটি কাজ ${bn(d1)} দিনে করতে পারে। ${bn(m2)} জন লোক একই কাজ কত দিনে করবে?`,
    buildMCQ(ans, [ans + 2, ans - 2, d1, ans + 1]),
    `মোট কাজ = ${bn(m1)} × ${bn(d1)} = ${bn(work)} লোক-দিন; ${bn(work)} ÷ ${bn(m2)} = ${bn(ans)} দিন।`);
});

// 11) speed-distance-time (find distance)
times(() => {
  const speed = randInt(3, 12) * 5;
  const time = randInt(2, 6);
  const ans = speed * time;
  add('math', 'speed', `একটি গাড়ি ঘণ্টায় ${bn(speed)} কিমি বেগে ${bn(time)} ঘণ্টা চললে কত কিমি পথ অতিক্রম করবে?`,
    buildMCQ(ans, [ans + speed, ans - speed, speed, ans + 10]),
    `দূরত্ব = বেগ × সময় = ${bn(speed)} × ${bn(time)} = ${bn(ans)} কিমি।`);
});

// 12) pythagoras hypotenuse
times(() => {
  const triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [20, 21, 29], [10, 24, 26]];
  const [x, y, h] = choice(triples);
  add('math', 'geometry', `একটি সমকোণী ত্রিভুজের দুই বাহু ${bn(x)} ও ${bn(y)} হলে অতিভুজ কত?`,
    buildMCQ(h, [h + 1, h - 1, x + y, h + 2]),
    `অতিভুজ = √(${bn(x)}² + ${bn(y)}²) = √${bn(x * x + y * y)} = ${bn(h)}।`);
});

// 13) day after N days
const DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
times(() => {
  const start = randInt(0, 6);
  const n = randInt(10, 200);
  const ansIdx = (start + n) % 7;
  const ans = DAYS[ansIdx];
  const opts = shuffle([ans, DAYS[(ansIdx + 1) % 7], DAYS[(ansIdx + 2) % 7], DAYS[(ansIdx + 5) % 7]]);
  if (new Set(opts).size !== 4) return;
  out.push({
    id: `gq-${++counter}`, categoryId: 'mental', subTopic: 'calendar', difficulty: 'medium',
    question: `আজ ${DAYS[start]} হলে ${bn(n)} দিন পরে কী বার হবে?`,
    options: opts, answerIndex: opts.indexOf(ans),
    explanation: `${bn(n)} ÷ ৭ = ভাগশেষ ${bn(n % 7)}; ${DAYS[start]} থেকে ${bn(n % 7)} দিন পরে ${ans}।`,
  });
});

// 14) mirror clock (whole hours)
times(() => {
  const h = randInt(1, 11);
  const mh = (12 - h) % 12 === 0 ? 12 : 12 - h;
  add('mental', 'clock', `আয়নায় ঘড়িতে ${bn(h)}টা বাজলে প্রকৃত সময় কত?`,
    { options: shuffle([mh, (mh % 12) + 1, (mh + 1) % 12 || 12, h]).map((x) => bn(x) + 'টা'),
      answerIndex: -1 },
    `আয়নায় সময় = ১২ − ${bn(h)} = ${bn(mh)}টা।`);
});

// rebuild mirror-clock options cleanly (ensure correct index)
// (handled below by post-filter)

// 15) letter series (arithmetic shift)
const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
times(() => {
  const start = randInt(0, 12);
  const step = choice([1, 2, 3]);
  const idxs = [start, start + step, start + 2 * step, start + 3 * step];
  if (idxs[3] + step > 25) return;
  const seq = idxs.map((i) => A[i]);
  const ans = A[start + 4 * step];
  const opts = shuffle([ans, A[(start + 4 * step + 1) % 26], A[(start + 4 * step + 2) % 26], A[(start + 3 * step) % 26]]);
  if (new Set(opts).size !== 4) return;
  out.push({
    id: `gq-${++counter}`, categoryId: 'mental', subTopic: 'series', difficulty: 'medium',
    question: `ধারা: ${seq.join(', ')}, ? — পরবর্তী অক্ষর কোনটি?`,
    options: opts, answerIndex: opts.indexOf(ans),
    explanation: `প্রতিবার ${bn(step)} ধাপ করে এগোচ্ছে; পরবর্তী অক্ষর ${ans}।`,
  });
});

// Fix mirror-clock entries that were added with answerIndex -1
for (const q of out) {
  if (q.subTopic === 'clock' && q.answerIndex === -1) {
    const m = q.explanation.match(/= ([০-৯]+)টা।$/);
    if (m) {
      const correct = m[1] + 'টা';
      q.answerIndex = q.options.indexOf(correct);
    }
  }
}

// Drop degenerate items, then de-duplicate by normalized question text.
const seen = new Set();
const norm = (s) => String(s).replace(/\s+/g, ' ').trim().toLowerCase();
const clean = out.filter((q) => {
  if (q.answerIndex < 0 || q.answerIndex > 3) return false;
  if (new Set(q.options).size !== 4) return false;
  const key = q.categoryId + '|' + norm(q.question);
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
// stable ids after filtering
clean.forEach((q, i) => { q.id = `gq-${i + 1}`; });

fs.writeFileSync(OUT, JSON.stringify(clean, null, 2) + '\n', 'utf8');
const byCat = {};
clean.forEach((q) => (byCat[q.categoryId] = (byCat[q.categoryId] || 0) + 1));
console.log(`Generated ${clean.length} computed questions -> ${path.relative(path.join(__dirname, '..'), OUT)}`);
console.log('  ', JSON.stringify(byCat));
