import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import { QUESTIONS } from '../data/questions';
import { CATEGORIES } from '../data/categories';

const TILES = [
  { key: 'Categories', title: 'Browse by Category', subtitle: 'Practice topic-wise', emoji: '📚' },
  { key: 'MockSetup', title: 'Start Mock Test', subtitle: 'Full exam or quick practice', emoji: '⏱️' },
  { key: 'Performance', title: 'My Performance', subtitle: 'View progress & history', emoji: '📊' },
];

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>BCS Preliminary</Text>
          <Text style={styles.heroSubtitle}>প্রস্তুতি সহজ ও পরিকল্পিত ভাবে</Text>
          <View style={styles.heroStatsRow}>
            <Stat label="Questions" value={QUESTIONS.length} />
            <Stat label="Categories" value={CATEGORIES.length} />
            <Stat label="Total Marks" value="200" />
          </View>
        </View>

        {TILES.map((tile) => (
          <Pressable
            key={tile.key}
            onPress={() =>
              tile.key === 'MockSetup'
                ? navigation.navigate('MockSetup')
                : navigation.navigate(tile.key)
            }
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.tileEmoji}>{tile.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tileTitle}>{tile.title}</Text>
              <Text style={styles.tileSubtitle}>{tile.subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, gap: spacing.md },
  heroCard: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroSubtitle: { color: '#E0F2EC', marginTop: 4, fontSize: 15 },
  heroStatsRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.md },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', padding: spacing.sm, borderRadius: radius.sm },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#E0F2EC', fontSize: 12, marginTop: 2 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileEmoji: { fontSize: 28 },
  tileTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  tileSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 28, color: colors.textMuted },
});
