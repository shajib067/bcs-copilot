import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import { confirm } from '../utils/confirm';
import {
  getOverallStats,
  getTestHistory,
  getCategoryStats,
  clearAllProgress,
} from '../storage/progressStore';
import { perCategoryFromStats, buildRecommendations, headline } from '../data/recommendations';

export default function PerformanceScreen() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [perCategory, setPerCategory] = useState([]);

  const load = useCallback(async () => {
    const [s, h, cs] = await Promise.all([getOverallStats(), getTestHistory(), getCategoryStats()]);
    setStats(s);
    setHistory(h);
    setPerCategory(perCategoryFromStats(cs));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleClear = () => {
    confirm({
      title: 'Reset all progress?',
      message: 'Test history and practice stats will be cleared. This cannot be undone.',
      confirmText: 'Reset',
      destructive: true,
      onConfirm: async () => {
        await clearAllProgress();
        load();
      },
    });
  };

  const recommendations = buildRecommendations(perCategory);
  const tip = headline(perCategory);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <FlatList
        data={history}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            {stats && (
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Practice Stats</Text>
                <View style={styles.statsGrid}>
                  <StatTile label="Attempts" value={stats.totalAttempts} />
                  <StatTile label="Correct" value={stats.totalCorrect} color={colors.success} />
                  <StatTile label="Wrong" value={stats.totalWrong} color={colors.danger} />
                  <StatTile label="Accuracy" value={`${stats.accuracy}%`} color={colors.primary} />
                </View>
              </View>
            )}

            <View style={styles.recCard}>
              <Text style={styles.recTitle}>Recommendations</Text>
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

            {perCategory.length > 0 && (
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Accuracy by Topic</Text>
                <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
                  {perCategory.map((c) => (
                    <CategoryBar key={c.categoryId} row={c} />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Mock Test History</Text>
              {(history.length > 0 || perCategory.length > 0) && (
                <Pressable onPress={handleClear} hitSlop={8}>
                  <Text style={styles.clearText}>Reset</Text>
                </Pressable>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => <HistoryRow item={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tests taken yet</Text>
            <Text style={styles.emptyText}>Take a mock test to see your scores here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function StatTile({ label, value, color = colors.text }) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statTileValue, { color }]}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function CategoryBar({ row }) {
  return (
    <View style={styles.barRow}>
      <View style={styles.barHeader}>
        <Text style={styles.barName} numberOfLines={1}>{row.name}</Text>
        <Text style={styles.barPct}>{row.accuracy}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${row.accuracy}%`, backgroundColor: row.color }]} />
      </View>
      <Text style={styles.barMeta}>✓ {row.correct} · ✗ {row.wrong}</Text>
    </View>
  );
}

function HistoryRow({ item }) {
  const date = new Date(item.date);
  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const passed = item.score >= item.total * 0.5;
  return (
    <View style={styles.row}>
      <View style={[styles.scoreBlock, { backgroundColor: passed ? colors.success : colors.danger }]}>
        <Text style={styles.scoreValue}>{item.score.toFixed(1)}</Text>
        <Text style={styles.scoreOf}>/ {item.total}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowDate}>{dateStr} • {timeStr}</Text>
        <Text style={styles.rowMeta}>✓ {item.correct} · ✗ {item.wrong} · — {item.skipped}</Text>
        {item.autoSubmitted && <Text style={styles.autoTag}>Auto-submitted</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  statsCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.bg,
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  statTileValue: { fontSize: 22, fontWeight: '800' },
  statTileLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  recCard: {
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  recTitle: { fontSize: 16, fontWeight: '800', color: '#0C4A6E', marginBottom: spacing.xs },
  recHeadline: { fontSize: 14, fontWeight: '700', color: '#0C4A6E' },
  recHeadlineEn: { fontSize: 12, color: '#1E40AF', marginTop: 2 },
  recList: { gap: spacing.sm, marginTop: spacing.sm },
  recItem: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  recDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  recTip: { flex: 1, fontSize: 13, lineHeight: 20, color: colors.text },
  barRow: { gap: 4 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barName: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
  barPct: { fontSize: 13, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  barTrack: { height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  clearText: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreBlock: { width: 70, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  scoreValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  scoreOf: { color: '#fff', fontSize: 11, opacity: 0.9 },
  rowDate: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  autoTag: { fontSize: 11, color: colors.warning, marginTop: 2, fontWeight: '600' },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyText: { color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
});
