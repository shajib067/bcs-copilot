import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import OptionButton from '../components/OptionButton';
import { getQuestionsByCategory, getCategorySession } from '../data/questions';
import { getCategoryById } from '../data/categories';
import { recordAnswer } from '../storage/progressStore';

export default function PracticeScreen({ route, navigation }) {
  const { categoryId, count } = route.params;
  const category = getCategoryById(categoryId);
  const questions = useMemo(
    () => (count ? getCategorySession(categoryId, count) : getQuestionsByCategory(categoryId)),
    [categoryId, count]
  );
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    navigation.setOptions({ title: category?.nameEn ?? 'Practice' });
  }, [category, navigation]);

  if (questions.length === 0) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No questions yet in this category.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const q = questions[idx];
  const useBengali = isBengaliCategory(categoryId);
  const answered = selected !== null;

  const handleSelect = async (i) => {
    if (answered) return;
    setSelected(i);
    await recordAnswer(q.id, i === q.answerIndex, q.categoryId);
  };

  const handleNext = () => {
    setSelected(null);
    if (idx + 1 < questions.length) setIdx(idx + 1);
    else navigation.goBack();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Question {idx + 1} of {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((idx + 1) / questions.length) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.qCard}>
          {(q.source || q.year) && (
            <Text style={styles.sourceBadge}>{q.source || `${q.year}th BCS`}</Text>
          )}
          <Text style={styles.qText}>{q.question}</Text>
        </View>

        <View style={{ gap: spacing.sm }}>
          {q.options.map((opt, i) => {
            let state = 'idle';
            if (answered) {
              if (i === q.answerIndex) state = 'correct';
              else if (i === selected) state = 'wrong';
            }
            return (
              <OptionButton
                key={i}
                index={i}
                text={opt}
                state={state}
                useBengali={useBengali}
                onPress={() => handleSelect(i)}
              />
            );
          })}
        </View>

        {answered && (
          <View style={styles.explanation}>
            <Text style={styles.explanationLabel}>{useBengali ? 'ব্যাখ্যা' : 'Explanation'}</Text>
            <Text style={styles.explanationText}>{q.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {answered && (
        <View style={styles.footer}>
          <Pressable onPress={handleNext} style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.nextBtnText}>
              {idx + 1 < questions.length ? (useBengali ? 'পরবর্তী' : 'Next') : useBengali ? 'শেষ' : 'Finish'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function isBengaliCategory(id) {
  return !['english'].includes(id);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  progressRow: { gap: spacing.sm },
  progressText: { fontSize: 13, color: colors.textMuted },
  progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  qCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qText: { fontSize: 17, lineHeight: 26, color: colors.text, fontWeight: '600' },
  sourceBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: '#E6F4EF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  explanation: {
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  explanationLabel: { fontSize: 12, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  explanationText: { fontSize: 14, lineHeight: 22, color: '#451A03' },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  nextBtn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  emptyText: { color: colors.textMuted, fontSize: 15 },
});
