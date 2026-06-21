import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENTITLEMENT_ID, REVENUECAT_API_KEY } from './config';

// RevenueCat is a native module; it is absent in Expo Go. Load it defensively
// so the app still runs everywhere. Real purchases activate once the SDK is
// present (EAS/dev build) AND REVENUECAT_API_KEY is set.
let Purchases = null;
try {
  // eslint-disable-next-line global-require
  Purchases = require('react-native-purchases').default;
} catch (e) {
  Purchases = null;
}

const STORE_KEY = 'entitlement:premium';
const PremiumContext = createContext(null);

const purchasesReady = () => Boolean(Purchases && REVENUECAT_API_KEY);

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Local cache first so the UI doesn't flicker / works offline.
        const cached = await AsyncStorage.getItem(STORE_KEY);
        if (!cancelled && cached === 'true') setIsPremium(true);

        if (purchasesReady()) {
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
          const info = await Purchases.getCustomerInfo();
          const active = Boolean(info?.entitlements?.active?.[ENTITLEMENT_ID]);
          if (!cancelled) {
            setIsPremium(active);
            await AsyncStorage.setItem(STORE_KEY, active ? 'true' : 'false');
          }
        }
      } catch (e) {
        // Stay with cached value on any failure.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grantLocal = useCallback(async (value) => {
    setIsPremium(value);
    await AsyncStorage.setItem(STORE_KEY, value ? 'true' : 'false');
  }, []);

  // Returns { ok: true } on success, or { ok: false, reason } otherwise.
  const purchasePremium = useCallback(async () => {
    if (!purchasesReady()) {
      return { ok: false, reason: 'unavailable' };
    }
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings?.current?.availablePackages?.[0];
      if (!pkg) return { ok: false, reason: 'no_product' };
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
      await grantLocal(active);
      return active ? { ok: true } : { ok: false, reason: 'not_active' };
    } catch (e) {
      if (e?.userCancelled) return { ok: false, reason: 'cancelled' };
      return { ok: false, reason: 'error' };
    }
  }, [grantLocal]);

  const restorePurchases = useCallback(async () => {
    if (!purchasesReady()) return { ok: false, reason: 'unavailable' };
    try {
      const info = await Purchases.restorePurchases();
      const active = Boolean(info?.entitlements?.active?.[ENTITLEMENT_ID]);
      await grantLocal(active);
      return active ? { ok: true } : { ok: false, reason: 'nothing_to_restore' };
    } catch (e) {
      return { ok: false, reason: 'error' };
    }
  }, [grantLocal]);

  const value = useMemo(
    () => ({ isPremium, loading, purchasesAvailable: purchasesReady(), purchasePremium, restorePurchases }),
    [isPremium, loading, purchasePremium, restorePurchases]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within a PremiumProvider');
  return ctx;
}
