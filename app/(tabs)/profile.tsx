import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { activities as activitiesTable, categories as categoriesTable, guests as guestsTable, targets as targetsTable, trips as tripsTable, users as usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../_layout';

export default function ProfileScreen() {
  const context = useContext(TripContext);
  const router = useRouter();

  if (!context) return null;
  const { trips, activities, guests, setTrips, setActivities, setCategories, setTargets, setGuests } = context;

  const totalCost = activities.reduce((sum, a) => sum + a.cost, 0);
  const totalGuests = guests.length;

  const handleLogout = () => {
    router.replace('/login');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your hen party data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await db.delete(guestsTable);
            await db.delete(activitiesTable);
            await db.delete(targetsTable);
            await db.delete(tripsTable);
            await db.delete(categoriesTable);
            await db.delete(usersTable).where(eq(usersTable.id, 1));
            setTrips([]);
            setActivities([]);
            setCategories([]);
            setTargets([]);
            setGuests([]);
            router.replace('/register');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Profile" subtitle="Manage your account" />

      <View style={styles.card}>
        <Text style={styles.username}>demo</Text>
        <Text style={styles.statsLine}>
          {trips.length} hens · {activities.length} activities · {totalGuests} guests · €{totalCost} total
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <PrimaryButton label="Log Out" variant="secondary" onPress={handleLogout} />
        <View style={styles.spacer} />
        <PrimaryButton label="Delete Account" variant="danger" onPress={handleDeleteAccount} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FFF8FA', flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#F0C6D4', borderRadius: 14, borderWidth: 1, marginTop: 12, padding: 18 },
  username: { color: '#1F1126', fontSize: 22, fontWeight: '700' },
  statsLine: { color: '#6B7280', fontSize: 14, marginTop: 4 },
  section: { marginTop: 28 },
  sectionTitle: { color: '#1F1126', fontSize: 17, fontWeight: '700', marginBottom: 12 },
  spacer: { height: 10 },
});
