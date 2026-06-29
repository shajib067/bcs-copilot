import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import { getPreviousYearExams } from '../data/questions';
import { usePremium } from '../monetization/premium';
import { FREE_RECENT_EXAM_PREVIEW } from '../monetization/config';

const ALL_SESSION = 50; // mixed "all years" session length

export default function PreviousYearsScreen({ navigation }) {
  const { isPremium } = usePremium();
  const exams = getPreviousYearExams();
  const total = exams.reduce((s, e) => s + e.count, 0);
  // Free taste: the single most recent exam is unlocked.
  const freeYear = exams.length ? exams[0].year : null;

  const open = ({ prevYear, count, title, locked }) => {
    if (locked) {
      navigation.navigate('Paywall');
      return;
    }
    navigation.navigate('Practice', { prevYear, count, title });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.lead}>
          Drill real questions from past BCS preliminary exams — reconstructed and answer-verified,
          with an explanation on every one. {total} questions across {exams.length} exams.
        </Text>

        <Pressable
          onPress={() => open({ prevYear: 'all', count: ALL_SESSION, title: 'All Previous Years', locked: !isPremium })}
          style={({ pressed }) => [styles.allCard, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.allEmoji}>🗂️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.allTitle}>All Previous Years</Text>
            <Text style={styles.allSub}>{ALL_SESSION} mixed questions from every exam</Text>
          </View>
          <Text style={styles.allChevron}>{isPremium ? '›' : '🔒'}</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>By exam</Text>
        <View style={{ gap: spacing.sm }}>
          {exams.map((e) => {
            const locked = !isPremium && e.year !== freeYear;
            return (
              <Pressable
                key={e.year}
                onPress={() => open({ prevYear: e.year, title: e.source, locked })}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
              >
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>{e.year}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.examTitle}>{e.source}</Text>
                  <Text style={styles.examMeta}>
                    {e.year === freeYear && !isPremium
                      ? `${FREE_RECENT_EXAM_PREVIEW} free • ${e.count} total`
                      : `${e.count} questions`}
                  </Text>
                </View>
                {locked ? (
                  <Text style={styles.lock}>🔒</Text>
                ) : e.year === freeYear && !isPremium ? (
                  <Text style={styles.freeTag}>{FREE_RECENT_EXAM_PREVIEW} FREE</Text>
                ) : (
                  <Text style={styles.chevron}>›</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, gap: spacing.md },
  lead: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  allCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  allEmoji: { fontSize: 26 },
  allTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  allSub: { color: '#E0F2EC', fontSize: 13, marginTop: 2 },
  allChevron: { color: '#fff', fontSize: 26 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  yearBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearBadgeText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  examTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  examMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.textMuted },
  lock: { fontSize: 18 },
  freeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: '#E6F4EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
