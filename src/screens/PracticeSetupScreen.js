import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import { getCategoryById } from '../data/categories';
import { getQuestionsByCategory } from '../data/questions';

export default function PracticeSetupScreen({ route, navigation }) {
  const { categoryId } = route.params;
  const category = getCategoryById(categoryId);
  const total = getQuestionsByCategory(categoryId).length;

  useEffect(() => {
    navigation.setOptions({ title: category?.nameEn ?? 'Practice' });
  }, [category, navigation]);

  // Offer 25 and 50; cap the larger option to what the category has.
  const options = [];
  if (total > 25) options.push({ count: 25, label: '25 questions' });
  const big = Math.min(50, total);
  options.push({ count: big, label: big >= 50 ? '50 questions' : `All ${big} questions` });
  if (total <= 25) options.unshift({ count: total, label: `All ${total} questions` });

  // de-dup if both resolved to the same count (very small category)
  const seen = new Set();
  const finalOptions = options.filter((o) => (seen.has(o.count) ? false : seen.add(o.count)));

  const start = (count) => navigation.navigate('Practice', { categoryId, count });

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.headerCard, { borderLeftColor: category?.color ?? colors.primary }]}>
          <Text style={styles.bnTitle}>{category?.name}</Text>
          <Text style={styles.enTitle}>{category?.nameEn}</Text>
          <Text style={styles.meta}>{total} questions available • {category?.marks} marks in the exam</Text>
        </View>

        <Text style={styles.lead}>Choose a session length. Questions are picked at random with instant answers and explanations.</Text>

        <View style={{ gap: spacing.sm }}>
          {finalOptions.map((o) => (
            <Pressable
              key={o.count}
              onPress={() => start(o.count)}
              style={({ pressed }) => [styles.optionCard, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.optionCount}>{o.count}</Text>
              <Text style={styles.optionLabel}>{o.label}</Text>
              <Text style={styles.optionChevron}>›</Text>
            </Pressable>
          ))}
        </View>
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
});
