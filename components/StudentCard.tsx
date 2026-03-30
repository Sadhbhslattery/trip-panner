import { Student } from '@/app/_layout';
import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  student: Student;
};

export default function StudentCard({ student }: Props) {
  const router = useRouter();
  const openDetails = () =>
    router.push({ pathname: '/student/[id]', params: { id: student.id.toString() } });

  return (
    <View style={styles.card}>
      <Pressable onPress={openDetails}>
        <Text style={styles.name}>{student.name}</Text>
      </Pressable>

      <View style={styles.tags}>
        <InfoTag label="Major" value={student.major} />
        <InfoTag label="Year" value={student.year} />
      </View>

      <PrimaryButton compact label="View Profile" onPress={openDetails} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  name: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
});
