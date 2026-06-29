const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'question-bank');
let all = [];
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  arr.forEach((q) => (q._file = f));
  all = all.concat(arr);
}
const norm = (s) =>
  String(s || '')
    .replace(/[\s\u00a0]+/g, ' ')
    .replace(/["'\u201c\u201d\u2018\u2019.,?!:;()\-\u2014_]/g, '')
    .trim()
    .toLowerCase();

console.log('TOTAL questions:', all.length);

// duplicate IDs
const ids = {};
let dupId = 0;
all.forEach((q) => {
  if (ids[q.id]) dupId++;
  ids[q.id] = 1;
});
console.log('Duplicate IDs:', dupId);

// group by normalized text (ignoring category)
const byText = {};
all.forEach((q) => {
  const k = norm(q.question);
  (byText[k] = byText[k] || []).push(q);
});

let crossCat = 0, sameCat = 0;
const crossExamples = [];
for (const k in byText) {
  const g = byText[k];
  if (g.length > 1) {
    const cats = new Set(g.map((q) => q.categoryId));
    if (cats.size > 1) {
      crossCat++;
      if (crossExamples.length < 10) crossExamples.push(g.map((q) => q.id + '[' + q.categoryId + ']').join(' = '));
    }
    const seen = {};
    g.forEach((q) => {
      if (seen[q.categoryId]) sameCat++;
      seen[q.categoryId] = 1;
    });
  }
}
console.log('Within-category exact duplicates:', sameCat);
console.log('Cross-category identical-question groups:', crossCat);
crossExamples.forEach((e) => console.log('   ', e));

// validity
let badAns = 0, badOpt = 0;
all.forEach((q) => {
  if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex > 3) badAns++;
  const o = (q.options || []).map((x) => norm(x));
  if (new Set(o).size !== 4) badOpt++;
});
console.log('Invalid answerIndex:', badAns, '| non-distinct options:', badOpt);

const cc = {};
all.forEach((q) => (cc[q.categoryId] = (cc[q.categoryId] || 0) + 1));
console.log('\nPer-category counts:');
Object.entries(cc).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log('  ' + c.padEnd(13) + n));
