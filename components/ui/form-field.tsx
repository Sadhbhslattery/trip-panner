import { useColors } from '@/hooks/useColors';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export default function FormField({ label, value, onChangeText, placeholder }: Props) {
  const c = useColors();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: c.textSoft }]}>{label}</Text>
      <TextInput
        placeholder={placeholder ?? label}
        placeholderTextColor={c.textFaint}
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, fontSize: 15, paddingHorizontal: 12, paddingVertical: 10 },
});
