import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';
import { getQuestionsByIds } from '../data/questions';
import { getFavorites, toggleFavorite } from '../storage/bookmarkStore';
import QuestionCard from '../components/QuestionCard';

export default function SavedScreen() {
  const [items, setItems] = useState([]);
  const [favs, setFavs] = useState(new Set());

  const load = useCallback(() => {
    getFavorites().then((set) => {
      setFavs(set);
      setItems(getQuestionsByIds(set));
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onToggleFav = async (id) => {
    await toggleFavorite(id);
    setFavs((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setItems((prev) => prev.filter((q) => q.id !== id));
  };

  if (items.length === 0) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>★</Text>
          <Text style={styles.emptyTitle}>No saved questions yet</Text>
          <Text style={styles.emptyText}>
            Tap the star on any question while practising to save it here for quick revision.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListHeaderComponent={<Text style={styles.count}>{items.length} saved</Text>}
        renderItem={({ item }) => (
          <QuestionCard question={item} isFavorite={favs.has(item.id)} onToggleFavorite={onToggleFav} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  count: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  emptyEmoji: { fontSize: 40, color: '#F5A623' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center' },
});
