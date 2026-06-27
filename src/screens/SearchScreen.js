import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme/colors';
import { searchQuestions, isFreeQuestion } from '../data/questions';
import { usePremium } from '../monetization/premium';
import { getFavorites, toggleFavorite } from '../storage/bookmarkStore';
import QuestionCard from '../components/QuestionCard';

export default function SearchScreen({ navigation }) {
  const { isPremium } = usePremium();
  const [query, setQuery] = useState('');
  const [favs, setFavs] = useState(new Set());

  useEffect(() => {
    let on = true;
    getFavorites().then((s) => on && setFavs(s));
    return () => {
      on = false;
    };
  }, []);

  const results = useMemo(() => searchQuestions(query, 50), [query]);

  const onToggleFav = async (id) => {
    const nowFav = await toggleFavorite(id);
    setFavs((prev) => {
      const next = new Set(prev);
      if (nowFav) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Search questions, topics, keywords…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {query.trim().length < 2 ? (
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Search in Bangla or English. Try “synonym”, “percentage”, “preposition”,
            “মুজিব”, “চর্যাপদ”, or “১৯৭১”.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
          ListHeaderComponent={
            <Text style={styles.count}>
              {results.length} result{results.length === 1 ? '' : 's'}
              {results.length === 50 ? '+ (refine to narrow)' : ''}
            </Text>
          }
          ListEmptyComponent={<Text style={styles.empty}>No matches. Try a different keyword.</Text>}
          renderItem={({ item }) => (
            <QuestionCard
              question={item}
              isFavorite={favs.has(item.id)}
              onToggleFavorite={onToggleFav}
              locked={!isPremium && !isFreeQuestion(item.id)}
              onUnlock={() => navigation.navigate('Paywall')}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    margin: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, paddingVertical: spacing.md, fontSize: 16, color: colors.text },
  hint: { padding: spacing.lg },
  hintText: { fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center' },
  count: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs },
  empty: { fontSize: 14, color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
});
