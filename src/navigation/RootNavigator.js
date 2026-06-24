import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import PracticeScreen from '../screens/PracticeScreen';
import PracticeSetupScreen from '../screens/PracticeSetupScreen';
import PreviousYearsScreen from '../screens/PreviousYearsScreen';
import MockSetupScreen from '../screens/MockSetupScreen';
import MockTestScreen from '../screens/MockTestScreen';
import ResultsScreen from '../screens/ResultsScreen';
import PerformanceScreen from '../screens/PerformanceScreen';
import PaywallScreen from '../screens/PaywallScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'BCS Copilot' }} />
        <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Categories' }} />
        <Stack.Screen name="PracticeSetup" component={PracticeSetupScreen} options={{ title: 'Practice' }} />
        <Stack.Screen name="PreviousYears" component={PreviousYearsScreen} options={{ title: 'Previous Years' }} />
        <Stack.Screen name="Practice" component={PracticeScreen} options={{ title: 'Practice' }} />
        <Stack.Screen name="MockSetup" component={MockSetupScreen} options={{ title: 'Mock Test' }} />
        <Stack.Screen name="MockTest" component={MockTestScreen} options={{ title: 'Mock Test', headerBackVisible: false }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Result', headerBackVisible: false }} />
        <Stack.Screen name="Performance" component={PerformanceScreen} options={{ title: 'My Performance' }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ title: 'Premium', presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
