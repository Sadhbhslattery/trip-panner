import { useColors } from '@/hooks/useColors';
import { StyleSheet, Text, View } from 'react-native';

type Props = { title: string; subtitle?: string };

export default function ScreenHeader({ title, subtitle }: Props) {
  const c = useColors();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: c.textSoft }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },
});
