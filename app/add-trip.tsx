import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { trips as tripsTable } from '@/db/schema';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from './_layout';

export default function AddTrip() {
  const router = useRouter();
  const context = useContext(TripContext);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
      notes: notes || null,
    });

    const rows = await db.select().from(tripsTable);
    setTrips(rows);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Add Trip" subtitle="Plan a new adventure." />
      <View style={styles.form}>
        <FormField label="Trip Name" value={name} onChangeText={setName} placeholder="e.g. Lisbon Long Weekend" />
        <FormField label="Destination" value={destination} onChangeText={setDestination} placeholder="e.g. Lisbon, Portugal" />
        <FormField label="Start Date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
        <FormField label="End Date" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any extra details..." />
      </View>

      <PrimaryButton label="Save Trip" onPress={saveTrip} />
      <View style={styles.spacer}>
        <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    padding: 20,
  },
  form: {
    marginBottom: 6,
  },
  spacer: {
    marginTop: 10,
  },
});
