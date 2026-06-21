import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import { usePremium } from '../monetization/premium';
import { PREMIUM_BENEFITS } from '../monetization/config';

export default function PaywallScreen({ navigation }) {
  const { isPremium, purchasesAvailable, purchasePremium, restorePurchases } = usePremium();
  const [busy, setBusy] = useState(false);

  if (isPremium) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.crown}>✓</Text>
          <Text style={styles.thanksTitle}>You're Premium</Text>
          <Text style={styles.thanksSub}>Everything is unlocked. Good luck with your preparation.</Text>
          <Pressable style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const onBuy = async () => {
    setBusy(true);
    const res = await purchasePremium();
    setBusy(false);
    if (res.ok) {
      Alert.alert('Unlocked', 'Premium is now active. Enjoy!');
      navigation.goBack();
    } else if (res.reason === 'cancelled') {
      // user backed out — no message needed
    } else if (res.reason === 'unavailable') {
      Alert.alert('Not available yet', 'In-app purchase will be available in the published app.');
    } else {
      Alert.alert('Purchase failed', 'Something went wrong. Please try again.');
    }
  };

  const onRestore = async () => {
    setBusy(true);
    const res = await restorePurchases();
    setBusy(false);
    if (res.ok) {
      Alert.alert('Restored', 'Your premium access has been restored.');
      navigation.goBack();
    } else if (res.reason === 'unavailable') {
      Alert.alert('Not available yet', 'Restore will work in the published app.');
    } else {
      Alert.alert('Nothing to restore', 'No previous purchase was found for this account.');
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroBadge}>PREMIUM</Text>
          <Text style={styles.heroTitle}>Unlock the full BCS Copilot</Text>
          <Text style={styles.heroSub}>One payment. No subscription. Yours forever.</Text>
        </View>

        <View style={styles.benefits}>
          {PREMIUM_BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
          onPress={onBuy}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Unlock Premium</Text>}
        </Pressable>

        <Pressable style={styles.restoreBtn} onPress={onRestore} disabled={busy}>
          <Text style={styles.restoreText}>Restore purchase</Text>
        </Pressable>

        {!purchasesAvailable && (
          <Text style={styles.devNote}>
            Purchases activate in the published build once billing is configured.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, gap: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  crown: { fontSize: 48, color: colors.primary },
  thanksTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  thanksSub: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  hero: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: radius.lg },
  heroBadge: {
    color: '#E0F2EC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroTitle: { color: '#fff', fontSize: 23, fontWeight: '800', marginTop: spacing.xs },
  heroSub: { color: '#E0F2EC', fontSize: 14, marginTop: 4 },
  benefits: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  benefitRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  check: { color: colors.primary, fontSize: 16, fontWeight: '800', lineHeight: 22 },
  benefitText: { flex: 1, fontSize: 15, lineHeight: 22, color: colors.text },
  primaryBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  restoreBtn: { alignItems: 'center', padding: spacing.sm },
  restoreText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  devNote: { fontSize: 12, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
});
