import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

const LABELS_BN = ['ক', 'খ', 'গ', 'ঘ'];
const LABELS_EN = ['A', 'B', 'C', 'D'];

export default function OptionButton({ index, text, state = 'idle', onPress, useBengali = true }) {
  const isDisabled = state !== 'idle';
  const variant = VARIANTS[state] ?? VARIANTS.idle;
  const label = useBengali ? LABELS_BN[index] : LABELS_EN[index];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: variant.bg, borderColor: variant.border },
        pressed && !isDisabled && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.label, { backgroundColor: variant.labelBg }]}>
        <Text style={[styles.labelText, { color: variant.labelText }]}>{label}</Text>
      </View>
      <Text style={[styles.text, { color: variant.textColor, fontWeight: variant.textWeight }]}>{text}</Text>
    </Pressable>
  );
}

const VARIANTS = {
  idle: {
    bg: colors.card,
    border: colors.border,
    labelBg: colors.bg,
    labelText: colors.text,
    textColor: colors.text,
    textWeight: '400',
  },
  selected: {
    bg: '#E0F2FE',
    border: '#0284C7',
    labelBg: '#0284C7',
    labelText: '#fff',
    textColor: '#0C4A6E',
    textWeight: '600',
  },
  correct: {
    bg: '#DCFCE7',
    border: colors.success,
    labelBg: colors.success,
    labelText: '#fff',
    textColor: '#14532D',
    textWeight: '600',
  },
  wrong: {
    bg: '#FEE2E2',
    border: colors.danger,
    labelBg: colors.danger,
    labelText: '#fff',
    textColor: '#7F1D1D',
    textWeight: '600',
  },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    borderWidth: 1.5,
  },
  label: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: { fontWeight: '700', fontSize: 14 },
  text: { flex: 1, fontSize: 15, lineHeight: 22 },
});
