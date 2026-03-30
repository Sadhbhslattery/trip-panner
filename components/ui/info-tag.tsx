import { useColors } from '@/hooks/useColors';
import { StyleSheet, Text, View } from 'react-native';

type Props = { label: string; value: string };

export default function InfoTag({ label, value }: Props) {
  const c = useColors();
  return (
    <View style={[styles.tag, { backgroundColor: c.accentSoft }]}>
      <Text style={[styles.label, { color: c.accent }]}>{label}</Text>
      <Text style={[styles.value, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { borderRadius: 999, flexDirection: 'row', marginRight: 8, marginBottom: 4, paddingHorizontal: 10, paddingVertical: 6 },
  label: { fontSize: 12, fontWeight: '600', marginRight: 4 },
  value: { fontSize: 12, fontWeight: '500' },
});
