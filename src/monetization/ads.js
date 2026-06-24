import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { usePremium } from './premium';

// react-native-google-mobile-ads is a native module; absent in Expo Go.
// Load defensively so the app runs everywhere; ads activate in an EAS/dev build.
let Ads = null;
try {
  // eslint-disable-next-line global-require
  Ads = require('react-native-google-mobile-ads');
} catch (e) {
  Ads = null;
}

// Paste your real AdMob ad unit IDs here to start earning. While these are
// null, Google's TEST ads are served (safe to ship-test, no revenue, no risk
// of policy strikes from clicking your own live ads).
const REAL = {
  bannerAndroid: null, // 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'
  interstitialAndroid: null, // 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'
};

export const adsAvailable = () => Boolean(Ads);

function bannerUnitId() {
  if (!Ads) return null;
  const real = Platform.OS === 'ios' ? null : REAL.bannerAndroid;
  return real || Ads.TestIds.BANNER;
}

function interstitialUnitId() {
  if (!Ads) return null;
  const real = Platform.OS === 'ios' ? null : REAL.interstitialAndroid;
  return real || Ads.TestIds.INTERSTITIAL;
}

let initialized = false;
export function initializeAds() {
  if (!Ads || initialized) return;
  initialized = true;
  try {
    Ads.default().initialize();
  } catch (e) {
    /* no-op */
  }
}

// Banner — renders nothing for premium users or when the module is unavailable.
export function AdBanner() {
  const { isPremium, loading } = usePremium();
  if (!Ads || isPremium || loading) return null;
  const { BannerAd, BannerAdSize } = Ads;
  const unitId = bannerUnitId();
  if (!unitId) return null;
  return (
    <BannerAd
      unitId={unitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  );
}

// Preloads an interstitial and returns show(); both are no-ops for premium
// users or when ads are unavailable, so callers never need to branch.
export function useInterstitial() {
  const { isPremium } = usePremium();
  const adRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!Ads || isPremium) return undefined;
    const { InterstitialAd, AdEventType } = Ads;
    const unitId = interstitialUnitId();
    if (!unitId) return undefined;
    const ad = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = ad;
    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      try {
        ad.load();
      } catch (e) {
        /* no-op */
      }
    });
    try {
      ad.load();
    } catch (e) {
      /* no-op */
    }
    return () => {
      try {
        unsubLoaded();
        unsubClosed();
      } catch (e) {
        /* no-op */
      }
    };
  }, [isPremium]);

  const show = () => {
    if (!Ads || isPremium || !adRef.current || !loadedRef.current) return;
    try {
      adRef.current.show();
    } catch (e) {
      /* no-op */
    }
  };

  return { show };
}
