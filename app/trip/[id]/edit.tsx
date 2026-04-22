/**
 * Edit Trip Screen — Update an Existing Hen
 *
 * Mirror of the Add Trip form but pre-populated with the trip's current values. The useEffect hook [R6] hydrates the form state from the trip
 * object once it's available in context.
 *
 * The dependency array `[trip]` ensures the form re-syncs if the user navigates to a different trip's edit screen without unmounting (a rare
 * edge case but the correct React pattern).
 *
 */

import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { trips as tripsTable } from '@/db/schema';
import { useColors } from '@/hooks/useColors';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../../_layout';

export default function EditTrip() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);
  const c = useColors();
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');

  const trip = context?.trips.find((t) => t.id === Number(id));

  /**
   * Hydrate form state from the existing trip whenever the trip reference changes. Numeric fields get converted to strings because TextInput
   * only accepts strings — they'll be parsed back to numbers on save.
   */
  useEffect(() => {
    if (!trip) return;
    setName(trip.name); setDestination(trip.destination); setStartDate(trip.startDate);
    setEndDate(trip.endDate); setGuestCount(trip.guestCount.toString()); setBudget(trip.budget.toString()); setNotes(trip.notes || '');
  }, [trip]);

  if (!context || !trip) return null;
  const { setTrips } = context;

  const save = async () => {
    await db.update(tripsTable).set({
      name, destination, startDate, endDate,
      guestCount: Number(guestCount) || 1,
      budget: Number(budget) || 0,
      notes: notes || null,
    }).where(eq(tripsTable.id, Number(id)));
    setTrips(await db.select().from(tripsTable));
    router.back();
  };

  return (
    <SafeAreaView style={{ backgroundColor: c.bg, flex: 1, padding: 20 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Edit Hen" subtitle={`Update ${trip.name}`} />
        <FormField label="Hen Name" value={name} onChangeText={setName} />
        <FormField label="Destination" value={destination} onChangeText={setDestination} />
        <FormField label="Start Date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
        <FormField label="End Date" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
        <FormField label="Number of Guests" value={guestCount} onChangeText={setGuestCount} keyboardType="numeric" />
        <FormField label="Total Budget (€)" value={budget} onChangeText={setBudget} keyboardType="numeric" />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} />
        <View style={{ marginTop: 6 }}>
          <PrimaryButton label="Save Changes" onPress={save} />
          <View style={{ marginTop: 10 }}><PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} /></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}