import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import { CATEGORIES } from '../data/categories';
import { getQuestionsByCategory } from '../data/questions';
import { usePremium } from '../monetization/premium';
import { FREE_CATEGORY_IDS } from '../monetization/config';

export default function CategoriesScreen({ navigation }) {
  const { isPremium } = usePremium();
  const data = CATEGORIES.map((c) => ({
    ...c,
    count: getQuestionsByCategory(c.id).length,
    locked: !isPremium && !FREE_CATEGORY_IDS.includes(c.id),
  }));

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              item.locked
                ? navigation.navigate('Paywall')
                : navigation.navigate('PracticeSetup', { categoryId: item.id })
            }
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.swatch, { backgroundColor: item.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bnTitle}>{item.name}</Text>
              <Text style={styles.enTitle}>{item.nameEn}</Text>
              <Text style={styles.meta}>
                {item.count} questions • {item.marks} marks
              </Text>
            </View>
            <Text style={styles.chevron}>{item.locked ? '🔒' : '›'}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  swatch: { width: 6, height: 48, borderRadius: 3 },
  bnTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  enTitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  chevron: { fontSize: 28, color: colors.textMuted },
});
