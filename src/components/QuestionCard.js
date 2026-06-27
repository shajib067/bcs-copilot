import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';
import { getCategoryById } from '../data/categories';

const BN_LABELS = ['ক', 'খ', 'গ', 'ঘ'];
const EN_LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionCard({ question, isFavorite, onToggleFavorite, locked, onUnlock }) {
  const cat = getCategoryById(question.categoryId);
  const labels = question.categoryId === 'english' ? EN_LABELS : BN_LABELS;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.tags}>
          {cat && (
            <View style={[styles.tag, { backgroundColor: cat.color }]}>
              <Text style={styles.tagText}>{cat.nameEn}</Text>
            </View>
          )}
          {(question.source || question.year) && (
            <View style={styles.sourceTag}>
              <Text style={styles.sourceTagText}>{question.source || `${question.year}th BCS`}</Text>
            </View>
          )}
        </View>
        {onToggleFavorite && (
          <Pressable hitSlop={10} onPress={() => onToggleFavorite(question.id)}>
            <Text style={[styles.star, isFavorite && styles.starOn]}>{isFavorite ? '★' : '☆'}</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.qText}>{question.question}</Text>

      {locked ? (
        <Pressable onPress={onUnlock} style={styles.lockBox}>
          <Text style={styles.lockTitle}>🔒 Answer & explanation locked</Text>
          <Text style={styles.lockSub}>Unlock Premium to see this</Text>
        </Pressable>
      ) : (
        <>
          <View style={{ gap: 6, marginTop: spacing.sm }}>
            {question.options.map((opt, i) => {
              const correct = i === question.answerIndex;
              return (
                <View key={i} style={[styles.opt, correct && styles.optCorrect]}>
                  <Text style={[styles.optLabel, correct && styles.optLabelCorrect]}>{labels[i]}</Text>
                  <Text style={[styles.optText, correct && styles.optTextCorrect]}>{opt}</Text>
                  {correct && <Text style={styles.check}>✓</Text>}
                </View>
              );
            })}
          </View>

          {!!question.explanation && (
            <View style={styles.expl}>
              <Text style={styles.explText}>{question.explanation}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  sourceTag: { backgroundColor: '#E6F4EF', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  sourceTagText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  star: { fontSize: 22, color: colors.textMuted, lineHeight: 22 },
  starOn: { color: '#F5A623' },
  qText: { fontSize: 16, lineHeight: 24, color: colors.text, fontWeight: '600' },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
  },
  optCorrect: { backgroundColor: '#E6F4EF', borderWidth: 1, borderColor: colors.primary },
  optLabel: { fontWeight: '700', color: colors.textMuted, width: 18, textAlign: 'center' },
  optLabelCorrect: { color: colors.primary },
  optText: { flex: 1, fontSize: 14, color: colors.text },
  optTextCorrect: { color: colors.primary, fontWeight: '600' },
  check: { color: colors.primary, fontWeight: '800' },
  expl: {
    marginTop: spacing.sm,
    backgroundColor: '#FFFDF5',
    borderLeftWidth: 3,
    borderLeftColor: '#F5A623',
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  explText: { fontSize: 13, lineHeight: 20, color: colors.text },
});
