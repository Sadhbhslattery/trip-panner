import { useColors } from '@/hooks/useColors';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  compact?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export default function PrimaryButton({ label, onPress, compact = false, variant = 'primary' }: Props) {
  const c = useColors();

  const bgColor = variant === 'primary' ? c.accent : variant === 'danger' ? c.danger : c.card;
  const borderColor = variant === 'secondary' ? c.border : bgColor;
  const textColor = variant === 'secondary' ? c.text : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bgColor, borderColor: borderColor, borderWidth: variant === 'secondary' ? 1 : 0 },
        compact && styles.compact,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: textColor }, compact && styles.compactLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 },
  compact: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 12, paddingVertical: 8 },
  pressed: { opacity: 0.85 },
  label: { fontSize: 15, fontWeight: '600' },
  compactLabel: { fontSize: 13 },
});
