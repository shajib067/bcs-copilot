import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import { getCategoryById } from '../data/categories';
import { perCategoryFromReview, buildRecommendations, headline } from '../data/recommendations';

export default function ResultsScreen({ route, navigation }) {
  const { result, review } = route.params;
  const passed = result.score >= result.total * 0.5;
  const perCategory = perCategoryFromReview(review);
  const recommendations = buildRecommendations(perCategory, { minAttempts: 1, threshold: 60 });
  const tip = headline(perCategory, { minAttempts: 1 });

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.heroCard, { backgroundColor: passed ? colors.success : colors.danger }]}>
          <Text style={styles.heroLabel}>Your Score</Text>
          <Text style={styles.heroScore}>
            {result.score.toFixed(1)} / {result.total}
          </Text>
          <Text style={styles.heroNote}>{passed ? '✓ Pass' : 'Keep practicing!'}</Text>
        </View>

        <View style={styles.statRow}>
          <StatBox label="Correct" value={result.correct} color={colors.success} />
          <StatBox label="Wrong" value={result.wrong} color={colors.danger} />
          <StatBox label="Skipped" value={result.skipped} color={colors.textMuted} />
        </View>

        <View style={styles.metaCard}>
          <MetaRow label="Time taken" value={formatDuration(result.durationSec)} />
          <MetaRow label="Negative marking" value="-0.5 per wrong" />
          <MetaRow label="Submitted" value={result.autoSubmitted ? 'Auto (time up)' : 'Manual'} />
        </View>

        <Text style={styles.reviewTitle}>Topic Breakdown</Text>
        <View style={styles.breakdownCard}>
          {perCategory.map((c) => (
            <CategoryBar key={c.categoryId} row={c} />
          ))}
        </View>

        <View style={styles.recCard}>
          <Text style={styles.recHeadline}>{tip.bn}</Text>
          <Text style={styles.recHeadlineEn}>{tip.en}</Text>
          {recommendations.length > 0 && (
            <View style={styles.recList}>
              {recommendations.map((r) => (
                <View key={r.categoryId} style={styles.recItem}>
                  <View style={[styles.recDot, { backgroundColor: r.color }]} />
                  <Text style={styles.recTip}>{r.tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.reviewTitle}>Review Answers</Text>
        {review.map((item, i) => (
          <ReviewCard key={item.q.id} index={i} item={item} />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => navigation.popToTop()}
          style={({ pressed }) => [styles.homeBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function CategoryBar({ row }) {
  const attempted = row.correct + row.wrong;
  return (
    <View style={styles.barRow}>
      <View style={styles.barHeader}>
        <Text style={styles.barName} numberOfLines={1}>{row.name}</Text>
        <Text style={styles.barPct}>{attempted > 0 ? `${row.accuracy}%` : '—'}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${row.accuracy}%`, backgroundColor: row.color }]} />
      </View>
      <Text style={styles.barMeta}>
        ✓ {row.correct} · ✗ {row.wrong}{row.skipped ? ` · — ${row.skipped}` : ''}
      </Text>
    </View>
  );
}

function StatBox({ label, value, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MetaRow({ label, value }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function ReviewCard({ index, item }) {
  const { q, picked, isCorrect } = item;
  const cat = getCategoryById(q.categoryId);
  const useBengali = q.categoryId !== 'english';
  const labels = useBengali ? ['ক', 'খ', 'গ', 'ঘ'] : ['A', 'B', 'C', 'D'];

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewIndex}>Q{index + 1}</Text>
        <View style={[styles.tag, { backgroundColor: cat?.color ?? colors.textMuted }]}>
          <Text style={styles.tagText}>{cat?.nameEn ?? ''}</Text>
        </View>
        <Text style={[styles.statusBadge, isCorrect ? styles.statusOk : styles.statusBad]}>
          {picked === null ? 'Skipped' : isCorrect ? 'Correct' : 'Wrong'}
        </Text>
      </View>
      <Text style={styles.reviewQ}>{q.question}</Text>
      <Text style={styles.reviewLine}>
        <Text style={styles.reviewLineLabel}>Correct: </Text>
        {labels[q.answerIndex]}. {q.options[q.answerIndex]}
      </Text>
      {picked !== null && picked !== q.answerIndex && (
        <Text style={styles.reviewLine}>
          <Text style={styles.reviewLineLabel}>Your answer: </Text>
          {labels[picked]}. {q.options[picked]}
        </Text>
      )}
      <Text style={styles.reviewExplain}>{q.explanation}</Text>
    </View>
  );
}

function formatDuration(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  heroCard: { padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' },
  heroLabel: { color: '#fff', opacity: 0.9, fontSize: 14 },
  heroScore: { color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 4 },
  heroNote: { color: '#fff', marginTop: 4, fontSize: 16, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  metaCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  metaLabel: { color: colors.textMuted, fontSize: 13 },
  metaValue: { color: colors.text, fontWeight: '600', fontSize: 13 },
  reviewTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  breakdownCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  barRow: { gap: 4 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barName: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
  barPct: { fontSize: 13, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  barTrack: { height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  recCard: {
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    gap: 4,
  },
  recHeadline: { fontSize: 15, fontWeight: '700', color: '#0C4A6E' },
  recHeadlineEn: { fontSize: 12, color: '#1E40AF', marginBottom: spacing.xs },
  recList: { gap: spacing.sm, marginTop: spacing.xs },
  recItem: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  recDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  recTip: { flex: 1, fontSize: 13, lineHeight: 20, color: colors.text },
  reviewCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  reviewIndex: { fontWeight: '800', color: colors.text },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  statusBadge: { marginLeft: 'auto', fontSize: 11, fontWeight: '700', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  statusOk: { backgroundColor: '#DCFCE7', color: '#14532D' },
  statusBad: { backgroundColor: '#FEE2E2', color: '#7F1D1D' },
  reviewQ: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  reviewLine: { fontSize: 13, color: colors.text, marginTop: 2 },
  reviewLineLabel: { color: colors.textMuted, fontWeight: '700' },
  reviewExplain: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, fontStyle: 'italic' },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  homeBtn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
