// Rebalances correct-answer positions across the bank so they're not skewed
// toward option A. Deterministic (seeded). Skips questions whose options are
// positional ("all of the above") or reference other options ("ক ও খ"), since
// shuffling those would break their meaning.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'question-bank');

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260629);

// "All of the above / none / both" style — must stay in place.
const POSITIONAL = /সবগুলো|সবকটি|সবগুলি|উপরের|কোনোটি|কোনটি|উভয়|all of the above|none of the above|both of|all of these|none of these/i;
// Options that reference other options by letter/numeral, e.g. "ক ও খ", "i ও ii".
const COMBO = /(^|[\s(])(ক|খ|গ|ঘ|i|ii|iii|a|b|c)\s*(ও|এবং|,|and|&)\s*(ক|খ|গ|ঘ|i|ii|iii|b|c|d)([\s).]|$)/i;

function protectedQ(q) {
  if (!Array.isArray(q.options) || q.options.length !== 4) return true;
  return q.options.some((o) => POSITIONAL.test(String(o)) || COMBO.test(String(o)));
}

let changed = 0;
let skipped = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const p = path.join(dir, f);
  const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
  let fileChanged = false;
  for (const q of arr) {
    if (protectedQ(q)) {
      skipped += 1;
      continue;
    }
    const order = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    q.options = order.map((i) => q.options[i]);
    q.answerIndex = order.indexOf(q.answerIndex);
    changed += 1;
    fileChanged = true;
  }
  if (fileChanged) fs.writeFileSync(p, JSON.stringify(arr, null, 2) + '\n');
}
console.log(`rebalanced ${changed} questions, skipped ${skipped} (positional/combo/malformed)`);
