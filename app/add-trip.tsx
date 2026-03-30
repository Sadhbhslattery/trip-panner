import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { trips as tripsTable } from '@/db/schema';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from './_layout';

export default function AddTrip() {
  const router = useRouter();
  const context = useContext(TripContext);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');

  if (!context) return null;
  const { setTrips } = context;

  const saveTrip = async () => {
    if (!name || !destination || !startDate || !endDate) return;

    await db.insert(tripsTable).values({
      userId: 1,
      name,
      destination,
      startDate,
      endDate,
      guestCount: Number(guestCount) || 1,
      budget: Number(budget) || 0,
      notes: notes || null,
    });

    const rows = await db.select().from(tripsTable);
    setTrips(rows);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Plan a Hen" subtitle="Let's get this party started." />
        <View style={styles.form}>
          <FormField label="Hen Name" value={name} onChangeText={setName} placeholder="e.g. Sarah's Hen - Galway" />
          <FormField label="Destination" value={destination} onChangeText={setDestination} placeholder="e.g. Galway, Ireland" />
          <FormField label="Start Date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
          <FormField label="End Date" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
          <FormField label="Number of Guests" value={guestCount} onChangeText={setGuestCount} placeholder="e.g. 12" />
          <FormField label="Total Budget (€)" value={budget} onChangeText={setBudget} placeholder="e.g. 3500 (leave blank for no limit)" />
          <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Bride's name, theme, surprises, allergies..." />
        </View>

        <PrimaryButton label="Create Hen" onPress={saveTrip} />
        <View style={styles.spacer}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFF8FA',
    flex: 1,
    padding: 20,
  },
  form: {
    marginBottom: 6,
  },
  spacer: {
    marginTop: 10,
    paddingBottom: 30,
  },
});
