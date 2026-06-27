import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import { CATEGORIES } from '../data/categories';
import { getQuestionsByCategory, getFreeCategoryCount } from '../data/questions';
import { usePremium } from '../monetization/premium';

export default function CategoriesScreen({ navigation }) {
  const { isPremium } = usePremium();
  const data = CATEGORIES.map((c) => ({
    ...c,
    count: getQuestionsByCategory(c.id).length,
    freeCount: getFreeCategoryCount(c.id),
  }));

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListHeaderComponent={
          !isPremium ? (
            <Text style={styles.note}>
              Free includes {data.reduce((s, c) => s + c.freeCount, 0)} questions across every
              subject. Unlock Premium for all {data.reduce((s, c) => s + c.count, 0)}.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('PracticeSetup', { categoryId: item.id })}
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
            {!isPremium && (
              <View style={styles.freeTag}>
                <Text style={styles.freeTagText}>{item.freeCount} free</Text>
              </View>
            )}
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  note: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginBottom: spacing.sm },
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
  freeTag: {
    backgroundColor: '#E6F4EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  freeTagText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  chevron: { fontSize: 28, color: colors.textMuted },
});
