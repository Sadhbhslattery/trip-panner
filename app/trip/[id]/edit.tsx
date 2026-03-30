import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { trips as tripsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../../_layout';

export default function EditTrip() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const trip = context?.trips.find((t) => t.id === Number(id));

  useEffect(() => {
    if (!trip) return;
    setName(trip.name);
    setDestination(trip.destination);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setNotes(trip.notes || '');
  }, [trip]);

  if (!context || !trip) return null;
  const { setTrips } = context;

  const saveChanges = async () => {
    await db
      .update(tripsTable)
      .set({ name, destination, startDate, endDate, notes: notes || null })
      .where(eq(tripsTable.id, Number(id)));

    const rows = await db.select().from(tripsTable);
    setTrips(rows);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Edit Trip" subtitle={`Update ${trip.name}`} />
      <View style={styles.form}>
        <FormField label="Trip Name" value={name} onChangeText={setName} />
        <FormField label="Destination" value={destination} onChangeText={setDestination} />
        <FormField label="Start Date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
        <FormField label="End Date" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} />
      </View>

      <PrimaryButton label="Save Changes" onPress={saveChanges} />
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
