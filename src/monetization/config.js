// Monetization policy — tweak the free/premium split here in one place.
//
// Model: freemium with a one-time "premium" unlock via Google Play Billing
// (RevenueCat). Free users get a meaningful taste; premium unlocks everything.

export const ENTITLEMENT_ID = 'premium';

// RevenueCat public SDK key. Leave empty to run in "local" mode (no real
// purchases — useful for Expo Go and pre-store testing). Fill in before release.
export const REVENUECAT_API_KEY = '';

// Free users get a capped number of questions per subject (a taste of every
// category). Everything beyond this pool is premium — enforced everywhere
// (practice, mocks, search, saved) so there's no backdoor to free answers.
export const FREE_QUESTIONS_PER_CATEGORY = 10;

// Mock lengths available to free users (others require premium).
export const FREE_MOCK_COUNTS = [25];

export const PREMIUM_BENEFITS = [
  'All 1,700+ questions across every subject',
  'Previous-year questions from past BCS exams',
  'Full 200-question mock exam (real BCS format)',
  '50 & 100-question practice mocks',
  'Complete performance analytics & weak-area insights',
  'No ads',
];
