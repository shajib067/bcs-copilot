import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import { getOverallStats, getTestHistory, clearTestHistory } from '../storage/progressStore';

export default function PerformanceScreen() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  const load = useCallback(async () => {
    const [s, h] = await Promise.all([getOverallStats(), getTestHistory()]);
    setStats(s);
    setHistory(h);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleClear = () => {
    Alert.alert('Clear all test history?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearTestHistory();
          load();
        },
      },
    ]);
  };

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
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Mock Test History</Text>
              {history.length > 0 && (
                <Pressable onPress={handleClear} hitSlop={8}>
                  <Text style={styles.clearText}>Clear</Text>
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
        <Text style={styles.rowMeta}>
          ✓ {item.correct} · ✗ {item.wrong} · — {item.skipped}
        </Text>
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
  scoreBlock: {
    width: 70,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  scoreValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  scoreOf: { color: '#fff', fontSize: 11, opacity: 0.9 },
  rowDate: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  autoTag: { fontSize: 11, color: colors.warning, marginTop: 2, fontWeight: '600' },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyText: { color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
});
