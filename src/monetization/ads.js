// Ads temporarily disabled for launch.
//
// react-native-google-mobile-ads 14.x doesn't compile under Expo SDK 54's
// New Architecture, and 16.x forces Gradle 9 (incompatible with SDK 54).
// To re-enable later: `npx expo install react-native-google-mobile-ads@<ver>`
// (test a 15.x that supports RN 0.81 without bumping Gradle), restore the real
// implementation from git history, and re-add the config plugin to app.json.
//
// These no-op stubs keep every screen working with zero ad code paths.

export const adsAvailable = () => false;
export function initializeAds() {}
export function AdBanner() {
  return null;
}
export function useInterstitial() {
  return { show: () => {} };
}
