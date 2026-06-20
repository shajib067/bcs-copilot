# BCS Copilot — Bangladesh Civil Service Preliminary

Android-first Expo / React Native app for BCS Preliminary exam preparation. Questions are pre-packed and work fully offline.

## Features (v0.1)

- **10 BCS categories** with marks distribution matching the official exam (200 marks total)
- **Practice mode** — browse questions per category with immediate feedback and Bengali explanations
- **Mock test** — 100 random questions, 60-minute timer, BCS-style negative marking (-0.5 per wrong)
- **Performance tracking** — overall accuracy + history of all mock tests, stored on-device via AsyncStorage
- **Weak-area recommendations** — per-topic accuracy analysis that flags where to focus next (after each mock test and in Performance)
- **Bengali + English content** — questions render in the exam's original language

## Question bank (offline, compact, not user-readable)

Questions are authored as readable JSON in **`/question-bank/*.json`** (the source of
truth, easy to edit). A build step compresses and base64-encodes the whole set into
**`src/data/bank.generated.js`**:

```bash
npm run build:bank
```

At runtime `src/data/questions.js` inflates that blob in memory. Two things fall out of this:

- **Not visible to users.** Only the encoded blob ships in the APK, so the readable
  question/answer JSON is never in the bundle — the answer key can't be casually
  extracted. (This is obfuscation + compression, not strong encryption.)
- **Minimal space.** The current bank is ~108 KB of JSON → ~28 KB encoded (~74% smaller).

Edit questions in `/question-bank/`, re-run `npm run build:bank`, and commit the
regenerated `bank.generated.js`. The build validates every question (4 distinct options,
valid answer index, known category, unique ids) and fails loudly on mistakes.

> ⚠️ The bundled questions cover **stable, canonical facts** (literature, history,
> geography, science, math, grammar). Volatile current-affairs (latest office-holders,
> figures, recent events) are intentionally excluded — top those up separately and
> review the bank for accuracy before release.

## Run locally

Requires Node 18+ and an Android device/emulator (or Expo Go app).

```bash
cd bcs-copilot
npm install
npm run android   # launches Metro + opens on connected Android
```

Or scan the Expo QR with **Expo Go** (Play Store) for the fastest test cycle.

## Build a real APK / AAB for the Play Store

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
```

This produces an `.aab` ready for Google Play. See https://docs.expo.dev/build/setup/.

## Project layout

```
src/
├── data/
│   ├── categories.js        # 10 BCS sections, marks, colors
│   ├── questions.js         # runtime loader (decodes the encoded bank)
│   ├── bank.generated.js    # AUTO-GENERATED encoded question bank (shipped)
│   └── recommendations.js   # weak-area analysis for study tips
├── screens/
│   ├── HomeScreen.js
│   ├── CategoriesScreen.js
│   ├── PracticeScreen.js
│   ├── MockTestScreen.js
│   ├── ResultsScreen.js
│   └── PerformanceScreen.js
├── components/
│   └── OptionButton.js
├── storage/
│   └── progressStore.js  # AsyncStorage wrapper
├── navigation/
│   └── RootNavigator.js
└── theme/
    └── colors.js
```

## Roadmap to monetization

The deferred items (auth + payments) line up best in this order:

1. **Grow the question bank.** Keep adding past-years' questions (35th–46th BCS recommended) to `/question-bank/*.json` and re-run `npm run build:bank`. The encoded bank stays bundled in the APK, so the app remains offline-first.
2. **Add Firebase Auth.** Email + Google sign-in via `expo-auth-session`. Store user profile in Firestore. Optional — you can still ship a paid app without accounts.
3. **Wire Google Play Billing.** Use `react-native-iap` or RevenueCat. Two SKUs:
   - `bcs_prep_lifetime` — one-time purchase
   - `bcs_prep_monthly` — auto-renewing subscription
4. **Gate features.** Free tier: 1 category + 1 mock test/week. Paid: everything unlocked. Add a `PaywallScreen` and an `entitlements` check before navigating to MockTest.
5. **Cloud sync.** Once auth is in, sync test history to Firestore so users keep progress across devices.
6. **Push notifications.** `expo-notifications` for daily-question reminders — proven engagement boost.
7. **iOS.** Same codebase. Add Apple Pay / StoreKit via RevenueCat for cross-platform billing.

## Editing / growing the question bank

Add or edit items in any file under `/question-bank/`. Each item:

```json
{
  "id": "unique-string",
  "categoryId": "bangla | english | bd_affairs | ...",
  "question": "প্রশ্ন এখানে",
  "options": ["ক", "খ", "গ", "ঘ"],
  "answerIndex": 0,
  "explanation": "ব্যাখ্যা এখানে",
  "difficulty": "easy | medium | hard"
}
```

Then run `npm run build:bank` and commit the regenerated `src/data/bank.generated.js`.
You can split questions across as many `.json` files as you like — the build merges them all.

## Notes

- Negative marking is set to `-0.5` per wrong answer (`NEGATIVE_PER_WRONG` in `MockTestScreen.js`) — matches the real BCS Preliminary.
- The pass threshold on the results screen is `score >= total * 0.5` for display only; the real cutoff varies per BCS round.
- `MAX_QUESTIONS = 100` in mock test — bump to 200 once the question bank has enough variety.
