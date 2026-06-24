# BCS Copilot — Launch Runbook

Everything needed to get the app onto your Pixel and into the Play Store.
Work top to bottom. Steps marked **[you]** need your accounts/credentials.

---

## 0. Housekeeping first

- [ ] **[you]** Revoke the GitHub personal access token that was shared in chat:
  GitHub → Settings → Developer settings → Personal access tokens → delete it.
- [ ] **[you]** Merge the work branch into `main`:
  ```bash
  git checkout main
  git merge feature/offline-question-bank
  git push origin main
  ```

---

## 1. Accounts to create (once)

- [ ] **[you]** Google Play Developer account — one-time $25. https://play.google.com/console
- [ ] **[you]** Expo account (free) — needed for EAS builds. https://expo.dev
- [ ] **[you]** RevenueCat account (free tier) — powers the purchase. https://app.revenuecat.com
- [ ] *(optional, iOS)* Apple Developer — $99/yr.

---

## 2. Local setup

```bash
# from the project folder
npm install
npm install -g eas-cli      # or: npx eas-cli@latest
eas login                    # use your Expo account
eas init                     # links the project, writes extra.eas.projectId into app.json
```
`eas.json` already exists with three profiles: `development`, `preview` (installable
APK), and `production` (Play app-bundle).

---

## 3. First test build for your Pixel

```bash
eas build -p android --profile preview
```
- This runs in the cloud (~10–20 min) and gives a download link for an **APK**.
- Install it on the Pixel 6 Pro (download the link on the phone, or `adb install`).
- Note: `react-native-purchases` is native, so the **purchase button won't do
  anything real yet** — that's expected until step 4. Everything else works.

**Test on device:** category practice (25/50), the full 200-question mock (timer +
negative marking + submit), Previous Years mode, performance analytics, the
disclaimer popup, and that progress survives an app restart.

---

## 4. Wire up the purchase (RevenueCat + Play billing)

**In Play Console** (after step 5 creates the app):
- [ ] **[you]** Monetize → Products → In-app products → **Create product**
  - Product ID: **`premium`** (must match `ENTITLEMENT_ID`/product expectations)
  - Type: one-time
  - Set price (suggest ৳200–300), activate it.

**In RevenueCat:**
- [ ] **[you]** Create a project → add the Play app (upload the Play service-account
  JSON it asks for; Play Console → Setup → API access).
- [ ] **[you]** Entitlements → create one with identifier **`premium`**.
- [ ] **[you]** Products → add the `premium` Play product → attach it to an Offering.
- [ ] **[you]** Copy the **public Android SDK key** (starts with `goog_...`).

**In the code:**
- [ ] Open `src/monetization/config.js` and paste the key:
  ```js
  export const REVENUECAT_API_KEY = 'goog_xxxxxxxxxxxxxxxx';
  ```
- [ ] Commit, then rebuild (`eas build -p android --profile preview`) and test a real
  purchase using a **Play license tester** account (Play Console → Setup → License
  testing) so you're not charged.

If `REVENUECAT_API_KEY` is left empty, the app runs fine in "local" mode and the
paywall shows a "purchases available in the published app" note — handy for UI testing.

---

## 5. Create the Play Store listing

In Play Console → **Create app**:
- App name: **BCS Copilot** · language: English · type: App · Free (with in-app purchase).

**Store listing** (copy from `STORE_LISTING.md`):
- [ ] Short description (≤80 chars) and full description.
- [ ] **App icon**: `assets/icon.png` (1024×1024).
- [ ] **Feature graphic**: `assets/store/feature-graphic.png` (1024×500). ✅ ready.
- [ ] **Screenshots**: capture 4–6 on the Pixel (min 2). Suggested: Home, Mock setup,
  a question mid-mock, Results with breakdown, Previous Years, a category explanation.

**Privacy policy** (required):
- [ ] **[you]** Host `PRIVACY.md` at a public URL (see section 7) and paste the link.
- [ ] **[you]** Add a real **support email** into `PRIVACY.md` before hosting.

**Two required forms** (both simple — the app collects no personal data):
- [ ] **Content rating** questionnaire → will come back "Everyone".
- [ ] **Data safety** → "No data collected / shared"; data stays on device.

---

## 6. Release

- [ ] Build the production bundle:
  ```bash
  eas build -p android --profile production
  ```
- [ ] Upload the `.aab` to **Testing → Internal testing** first. Add your own email as a
  tester, install via the opt-in link, and verify the real purchase end-to-end.
- [ ] When happy: **Production → Create release**, upload the bundle, roll out.
  (First review can take a few days.)

Optional one-command submit instead of manual upload:
```bash
eas submit -p android --latest      # needs a Play service-account key configured
```

---

## 7. Host the privacy policy free (GitHub Pages)

Fastest option:
1. In your repo on GitHub → **Settings → Pages**.
2. Source: deploy from `main`, folder `/root` (or `/docs`).
3. Rename/copy `PRIVACY.md` to `docs/privacy.md` (or `index.md`) so Pages serves it.
4. Your URL becomes `https://shajib067.github.io/bcs-copilot/privacy` — use that in Play.

(Or paste the text into a free Notion/Google Sites page and use that public link.)

---

## Quick status of assets

| Item | State |
|---|---|
| App icon / adaptive / splash / favicon | ✅ in `assets/` |
| Feature graphic (1024×500) | ✅ `assets/store/feature-graphic.png` |
| `eas.json` build config | ✅ created |
| Store listing copy | ✅ `STORE_LISTING.md` |
| Privacy policy text | ✅ `PRIVACY.md` (add support email) |
| In-app disclaimer | ✅ in app |
| Screenshots | ⬜ capture on device |
| RevenueCat key in config | ⬜ paste after setup |
| Play product `premium` | ⬜ create in Console |
