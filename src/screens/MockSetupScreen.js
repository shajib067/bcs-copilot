import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';

// BCS preliminary: 200 questions, 120 minutes, 0.5 negative marking.
// Practice modes keep the same ~0.6 min/question pace.
const FULL = { key: 'full', count: 200, durationMin: 120, title: 'Full Mock Exam', subtitle: 'Real BCS format', emoji: '🎯' };
const PRACTICE = [
  { key: 'p25', count: 25, durationMin: 15 },
  { key: 'p50', count: 50, durationMin: 30 },
  { key: 'p100', count: 100, durationMin: 60 },
];

export default function MockSetupScreen({ navigation }) {
  const start = (count, durationMin) =>
    navigation.navigate('MockTest', { count, durationMin });

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.lead}>
          Every mock mirrors the real exam's subject weighting and applies BCS negative marking
          (−0.5 per wrong answer).
        </Text>

        <Text style={styles.sectionLabel}>Full exam</Text>
        <Pressable
          onPress={() => start(FULL.count, FULL.durationMin)}
          style={({ pressed }) => [styles.fullCard, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.fullEmoji}>{FULL.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.fullTitle}>{FULL.title}</Text>
            <Text style={styles.fullSub}>
              {FULL.count} questions • {FULL.durationMin} min • {FULL.subtitle}
            </Text>
          </View>
          <Text style={styles.fullChevron}>›</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Quick practice</Text>
        <View style={styles.grid}>
          {PRACTICE.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => start(p.count, p.durationMin)}
              style={({ pressed }) => [styles.practiceCard, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.practiceCount}>{p.count}</Text>
              <Text style={styles.practiceLabel}>questions</Text>
              <Text style={styles.practiceTime}>{p.durationMin} min</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Tip: take a few quick practices to warm up, then attempt a full 200-question mock under
            real time pressure to simulate exam day.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, gap: spacing.md },
  lead: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  fullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  fullEmoji: { fontSize: 30 },
  fullTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  fullSub: { color: '#E0F2EC', fontSize: 13, marginTop: 3 },
  fullChevron: { color: '#fff', fontSize: 30 },
  grid: { flexDirection: 'row', gap: spacing.sm },
  practiceCard: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  practiceCount: { fontSize: 26, fontWeight: '800', color: colors.primary },
  practiceLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  practiceTime: { fontSize: 12, color: colors.text, fontWeight: '600', marginTop: spacing.xs },
  note: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: { fontSize: 13, lineHeight: 20, color: colors.textMuted },
});
