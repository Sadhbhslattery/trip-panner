import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
};

export default function InfoTag({ label, value }: Props) {
  return (
    <View style={styles.tag}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    flexDirection: 'row',
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  value: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '500',
  },
});
