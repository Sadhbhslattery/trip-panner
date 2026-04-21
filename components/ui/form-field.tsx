import { useColors } from '@/hooks/useColors';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityHint?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  multiline?: boolean;
};

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  accessibilityHint,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
}: Props) {
  const c = useColors();
  return (
    <View style={styles.wrapper} accessible={false}>
      <Text
        style={[styles.label, { color: c.textSoft }]}
        accessibilityRole="text"
        nativeID={`label-${label}`}
      >
        {label}
      </Text>
      <TextInput
        placeholder={placeholder ?? label}
        placeholderTextColor={c.textFaint}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        accessible={true}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint ?? `Enter ${label.toLowerCase()}`}
        aria-labelledby={`label-${label}`}
        style={[
          styles.input,
          { backgroundColor: c.input, borderColor: c.inputBorder, color: c.text },
          multiline && { minHeight: 80, paddingTop: 10, textAlignVertical: 'top' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, fontSize: 15, paddingHorizontal: 12, paddingVertical: 10 },
});