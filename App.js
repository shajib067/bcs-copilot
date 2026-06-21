import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { PremiumProvider } from './src/monetization/premium';

export default function App() {
  return (
    <SafeAreaProvider>
      <PremiumProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </PremiumProvider>
    </SafeAreaProvider>
  );
}
