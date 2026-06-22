# Previous-Year Questions — Sourcing & Verification SOP

This is the process for adding real previous-year BCS preliminary questions to the
bank **without** copyright problems and **without** propagating wrong answers.

## The one rule that keeps us safe
Reproduce **facts** (what was asked on a public government exam), never a
**publisher's work** (a coaching guide's selection, layout, or written solutions).
We reconstruct each question in our own words, verify the answer independently,
and write our own explanation. This is the same standard the better competitor
apps use.

Do **not**:
- copy a guidebook's question wording, ordering, or explanations verbatim;
- trust a blog/PDF's claimed answer without independent verification;
- include time-bound current-affairs answers as if they were still current.

## Step-by-step
1. **Pick a paper.** Prefer recent prelims (≈35th–46th) — current pattern, fewer
   stale answers. One BCS at a time.
2. **Identify the questions** from public sources (newspaper solved papers such as
   Prothom Alo / The Daily Star, BPSC notices, or freely circulating PDFs). Use
   these only to learn *what was asked*.
3. **Reconstruct** each question and its four options in our own words/format.
4. **Verify the answer independently** against an authoritative reference
   (Banglapedia, primary documents, BPSC's official final answer key where it
   exists). BPSC has revised some answers after challenges — use the revised one.
   If an answer is genuinely disputed or unverifiable, **drop the question**.
5. **Handle time-bound items.** If the correct answer depends on "now"
   (population, current office-holders, latest rankings), either drop it or
   reframe it historically ("As of the 40th BCS (2018)…"). Keep evergreen facts.
6. **Write our own one-line explanation.**
7. **Tag it** with the optional schema fields:
   - `"year": 45` (the BCS number)
   - `"source": "45th BCS (2023)"` (shown as a badge in the app)
8. **Build & dedup.** Run `npm run build:bank`. The de-duplicator automatically
   flags any item that collides with an existing question, so previous-year items
   that repeat our originals are caught.
9. **Decode-verify & commit** as usual.

## Schema example
```json
{
  "id": "py45-bd-1",
  "categoryId": "bd_affairs",
  "subTopic": "history",
  "difficulty": "medium",
  "question": "‘ভারত ছাড়ো’ আন্দোলন কত সালে শুরু হয়?",
  "options": ["১৯৪২", "১৯১৭", "১৯২৭", "১৯৩৭"],
  "answerIndex": 0,
  "explanation": "মহাত্মা গান্ধীর নেতৃত্বে ‘ভারত ছাড়ো’ আন্দোলন ১৯৪২ সালে শুরু হয়।",
  "year": 45,
  "source": "45th BCS (2023)"
}
```

## Naming
Use an id prefix that encodes the exam: `py<NN>-<cat>-<n>` (e.g. `py45-bn-3`),
and a file per exam: `question-bank/prevyear-45.json`.
