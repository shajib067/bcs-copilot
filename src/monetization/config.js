// Monetization policy — tweak the free/premium split here in one place.
//
// Model: freemium with a one-time "premium" unlock via Google Play Billing
// (RevenueCat). Free users get a meaningful taste; premium unlocks everything.

export const ENTITLEMENT_ID = 'premium';

// RevenueCat public SDK key. Leave empty to run in "local" mode (no real
// purchases — useful for Expo Go and pre-store testing). Fill in before release.
export const REVENUECAT_API_KEY = '';

// Free users can fully use these categories; the rest require premium.
export const FREE_CATEGORY_IDS = ['bangla', 'english', 'bd_affairs'];

// Mock lengths available to free users (others require premium).
export const FREE_MOCK_COUNTS = [25];

// In free practice within a premium category, how many questions are shown
// before the paywall (0 = fully locked).
export const FREE_PREVIEW_PER_CATEGORY = 10;

export const PREMIUM_BENEFITS = [
  'All 1,400+ questions across every subject',
  'Full 200-question mock exam (real BCS format)',
  '50 & 100-question practice mocks',
  'Complete performance analytics & weak-area insights',
  'All future question updates — one-time payment',
];
