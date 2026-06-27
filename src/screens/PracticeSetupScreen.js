import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import { getCategoryById } from '../data/categories';
import { getQuestionsByCategory, getFreeCategoryCount } from '../data/questions';
import { usePremium } from '../monetization/premium';

export default function PracticeSetupScreen({ route, navigation }) {
  const { categoryId } = route.params;
  const { isPremium } = usePremium();
  const category = getCategoryById(categoryId);
  const total = getQuestionsByCategory(categoryId).length;
  const freeCount = getFreeCategoryCount(categoryId);
  const available = isPremium ? total : freeCount;

  useEffect(() => {
    navigation.setOptions({ title: category?.nameEn ?? 'Practice' });
  }, [category, navigation]);

  // Session-length options, capped to what's actually available to this user.
  const counts = [];
  if (available > 25) counts.push(25);
  const big = Math.min(50, available);
  counts.push(big);
  if (available <= 25) counts.unshift(available);
  const seen = new Set();
  const finalCounts = counts.filter((c) => (seen.has(c) ? false : seen.add(c)) && c > 0);

  const start = (count) => navigation.navigate('Practice', { categoryId, count });

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.headerCard, { borderLeftColor: category?.color ?? colors.primary }]}>
          <Text style={styles.bnTitle}>{category?.name}</Text>
          <Text style={styles.enTitle}>{category?.nameEn}</Text>
          <Text style={styles.meta}>
            {isPremium
              ? `${total} questions available • ${category?.marks} marks in the exam`
              : `${freeCount} free questions • ${total} with Premium • ${category?.marks} marks`}
          </Text>
        </View>

        <Text style={styles.lead}>
          Choose a session length. Questions are picked at random with instant answers and
          explanations.
        </Text>

        <View style={{ gap: spacing.sm }}>
          {finalCounts.map((count) => (
            <Pressable
              key={count}
              onPress={() => start(count)}
              style={({ pressed }) => [styles.optionCard, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.optionCount}>{count}</Text>
              <Text style={styles.optionLabel}>
                {count >= 50 ? '50 questions' : `${count} questions`}
              </Text>
              <Text style={styles.optionChevron}>›</Text>
            </Pressable>
          ))}
        </View>

        {!isPremium && (
          <Pressable
            onPress={() => navigation.navigate('Paywall')}
            style={({ pressed }) => [styles.unlockCard, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.unlockEmoji}>🔓</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.unlockTitle}>Unlock all {total} {category?.nameEn} questions</Text>
              <Text style={styles.unlockSub}>Plus every subject, full mocks & previous years</Text>
            </View>
            <Text style={styles.optionChevron}>›</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, gap: spacing.md },
  headerCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 5,
  },
  bnTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  enTitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  lead: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  optionCount: { fontSize: 26, fontWeight: '800', color: colors.primary, minWidth: 52 },
  optionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  optionChevron: { fontSize: 26, color: colors.textMuted },
  unlockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EF',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unlockEmoji: { fontSize: 22 },
  unlockTitle: { fontSize: 14, fontWeight: '800', color: colors.primary },
  unlockSub: { fontSize: 12, color: colors.text, marginTop: 2 },
});
