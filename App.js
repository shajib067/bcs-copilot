import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { PremiumProvider } from './src/monetization/premium';
import { initializeAds } from './src/monetization/ads';

export default function App() {
  useEffect(() => {
    initializeAds();
  }, []);
  return (
    <SafeAreaProvider>
      <PremiumProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </PremiumProvider>
    </SafeAreaProvider>
  );
}
