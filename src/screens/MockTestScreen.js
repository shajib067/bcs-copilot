import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import OptionButton from '../components/OptionButton';
import { getMockTestQuestions } from '../data/questions';
import { MOCK_TEST_DURATION_MIN } from '../data/categories';
import { saveTestResult, recordAnswer } from '../storage/progressStore';

const MAX_QUESTIONS = 100;
const NEGATIVE_PER_WRONG = 0.5; // BCS negative marking

export default function MockTestScreen({ navigation }) {
  const questions = useMemo(() => getMockTestQuestions(MAX_QUESTIONS), []);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { qId: optionIndex }
  const [secondsLeft, setSecondsLeft] = useState(MOCK_TEST_DURATION_MIN * 60);
  const submittedRef = useRef(false);

  // Timer
  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Confirm exit on Android back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmExit();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmExit = () => {
    Alert.alert('Exit test?', 'Your progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => navigation.navigate('Home') },
    ]);
  };

  const submit = async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    const review = [];
    for (const q of questions) {
      const a = answers[q.id];
      if (a === undefined) {
        skipped += 1;
        review.push({ q, picked: null, isCorrect: false });
        continue;
      }
      const isCorrect = a === q.answerIndex;
      if (isCorrect) correct += 1;
      else wrong += 1;
      review.push({ q, picked: a, isCorrect });
      await recordAnswer(q.id, isCorrect, q.categoryId);
    }

    const score = correct - wrong * NEGATIVE_PER_WRONG;
    const result = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      total: questions.length,
      correct,
      wrong,
      skipped,
      score,
      durationSec: MOCK_TEST_DURATION_MIN * 60 - secondsLeft,
      autoSubmitted: auto,
    };
    await saveTestResult(result);
    navigation.replace('Results', { result, review });
  };

  const onSubmitPress = () => {
    const answeredCount = Object.keys(answers).length;
    const remaining = questions.length - answeredCount;
    Alert.alert(
      'Submit test?',
      remaining > 0 ? `${remaining} question(s) unanswered.` : 'Submit your answers?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => submit(false) },
      ]
    );
  };

  const q = questions[idx];
  const picked = answers[q.id];
  const useBengali = q.categoryId !== 'english';

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={confirmExit} hitSlop={12}>
          <Text style={styles.exit}>✕</Text>
        </Pressable>
        <Text style={styles.counter}>
          {idx + 1} / {questions.length}
        </Text>
        <Text style={[styles.timer, secondsLeft < 60 && { color: colors.danger }]}>{formatTime(secondsLeft)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.qCard}>
          <Text style={styles.qText}>{q.question}</Text>
        </View>
        <View style={{ gap: spacing.sm }}>
          {q.options.map((opt, i) => (
            <OptionButton
              key={i}
              index={i}
              text={opt}
              state={picked === i ? 'selected' : 'idle'}
              useBengali={useBengali}
              onPress={() => setAnswers({ ...answers, [q.id]: i })}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          style={({ pressed }) => [styles.navBtn, idx === 0 && styles.navBtnDisabled, pressed && idx !== 0 && { opacity: 0.85 }]}
        >
          <Text style={styles.navBtnText}>‹ Prev</Text>
        </Pressable>
        {idx + 1 < questions.length ? (
          <Pressable
            onPress={() => setIdx(idx + 1)}
            style={({ pressed }) => [styles.navBtnPrimary, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.navBtnPrimaryText}>Next ›</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onSubmitPress}
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.navBtnPrimaryText}>Submit</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exit: { fontSize: 22, color: colors.textMuted, paddingHorizontal: spacing.xs },
  counter: { fontSize: 14, fontWeight: '700', color: colors.text },
  timer: { fontSize: 16, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] },
  container: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  qCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qText: { fontSize: 17, lineHeight: 26, color: colors.text, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  navBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  navBtnPrimary: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  navBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  submitBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
});
