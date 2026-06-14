# BCS Copilot — Bangladesh Civil Service Preliminary

Android-first Expo / React Native app for BCS Preliminary exam preparation. Questions are pre-packed and work fully offline.

## Features (v0.1)

- **10 BCS categories** with marks distribution matching the official exam (200 marks total)
- **Practice mode** — browse questions per category with immediate feedback and Bengali explanations
- **Mock test** — 100 random questions, 60-minute timer, BCS-style negative marking (-0.5 per wrong)
- **Performance tracking** — overall accuracy + history of all mock tests, stored on-device via AsyncStorage
- **Bengali + English content** — questions render in the exam's original language

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
│   ├── categories.js   # 10 BCS sections, marks, colors
│   └── questions.js    # seed question bank (replace with real DB later)
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

1. **Grow the question bank.** Replace `src/data/questions.js` with a JSON pack of 5,000+ real BCS questions (past years 35th–46th BCS recommended). Keep it bundled inside the APK so the app stays offline-first.
2. **Add Firebase Auth.** Email + Google sign-in via `expo-auth-session`. Store user profile in Firestore. Optional — you can still ship a paid app without accounts.
3. **Wire Google Play Billing.** Use `react-native-iap` or RevenueCat. Two SKUs:
   - `bcs_prep_lifetime` — one-time purchase
   - `bcs_prep_monthly` — auto-renewing subscription
4. **Gate features.** Free tier: 1 category + 1 mock test/week. Paid: everything unlocked. Add a `PaywallScreen` and an `entitlements` check before navigating to MockTest.
5. **Cloud sync.** Once auth is in, sync test history to Firestore so users keep progress across devices.
6. **Push notifications.** `expo-notifications` for daily-question reminders — proven engagement boost.
7. **iOS.** Same codebase. Add Apple Pay / StoreKit via RevenueCat for cross-platform billing.

## Replacing the seed questions

The `QUESTIONS` array in `src/data/questions.js` is a plain JS list. Each item:

```js
{
  id: 'unique-string',
  categoryId: 'bangla' | 'english' | 'bd_affairs' | ... ,
  question: 'প্রশ্ন এখানে',
  options: ['ক', 'খ', 'গ', 'ঘ'],
  answerIndex: 0,         // 0..3
  explanation: 'ব্যাখ্যা এখানে',
}
```

For a large bank, generate this file from a CSV/SQLite source at build time, or load a bundled JSON via `require()` at app start.

## Notes

- Negative marking is set to `-0.5` per wrong answer (`NEGATIVE_PER_WRONG` in `MockTestScreen.js`) — matches the real BCS Preliminary.
- The pass threshold on the results screen is `score >= total * 0.5` for display only; the real cutoff varies per BCS round.
- `MAX_QUESTIONS = 100` in mock test — bump to 200 once the question bank has enough variety.
