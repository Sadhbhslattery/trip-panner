import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { activities as activitiesTable, categories as categoriesTable, guests as guestsTable, targets as targetsTable, trips as tripsTable, users as usersTable } from '@/db/schema';
import { useColors } from '@/hooks/useColors';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../_layout';

export default function ProfileScreen() {
  const context = useContext(TripContext);
  const router = useRouter();
  const c = useColors();

  if (!context) return null;
  const { trips, activities, guests, isDark, toggleTheme, setTrips, setActivities, setCategories, setTargets, setGuests } = context;

  const totalCost = activities.reduce((s, a) => s + a.cost, 0);

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This will permanently delete everything.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Everything', style: 'destructive',
        onPress: async () => {
          await db.delete(guestsTable);
          await db.delete(activitiesTable);
          await db.delete(targetsTable);
          await db.delete(tripsTable);
          await db.delete(categoriesTable);
          await db.delete(usersTable).where(eq(usersTable.id, 1));
          setTrips([]); setActivities([]); setCategories([]); setTargets([]); setGuests([]);
          router.replace('/register');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Profile" subtitle="Manage your account" />

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.username, { color: c.text }]}>demo</Text>
        <Text style={{ color: c.textSoft, fontSize: 14, marginTop: 4 }}>
          {trips.length} hens · {activities.length} activities · {guests.length} guests · €{totalCost} total
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Appearance</Text>
        <View style={[styles.themeRow, { backgroundColor: c.card, borderColor: c.border }]}>
          <View>
            <Text style={[styles.themeLabel, { color: c.text }]}>Dark Mode</Text>
            <Text style={{ color: c.textSoft, fontSize: 13, marginTop: 2 }}>
              {isDark ? 'On — easy on the eyes' : 'Off — light and bright'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#F0C6D4', true: '#4A2D50' }}
            thumbColor={isDark ? '#E86A98' : '#D4537E'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Account</Text>
        <PrimaryButton label="Log Out" variant="secondary" onPress={() => router.replace('/login')} />
        <View style={{ height: 10 }} />
        <PrimaryButton label="Delete Account" variant="danger" onPress={handleDeleteAccount} accessibilityHint="Permanently deletes your account and all hens, activities and guests" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  card: { borderRadius: 14, borderWidth: 1, marginTop: 12, padding: 18 },
  username: { fontSize: 22, fontWeight: '700' },
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  themeLabel: { fontSize: 16, fontWeight: '600' },
});
