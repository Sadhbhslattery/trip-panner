/**
 * Add Trip Screen — Create a New Hen
 * 
 * Collects the essential fields for a new hen party and inserts a row into the trips table. Required fields: name, destination, start date end date.
 * Optional: guest count, budget, notes.
 *
 * After insert: refresh the trips list from SQLite (so the new row gets its auto-generated id and appears immediately on the home screen) and navigate
 * back to where the user came from.
 *
 * Design note: dates are entered as plain YYYY-MM-DD strings rather than via a date picker. This keeps the form lightweight and avoids a platform-
 * specific picker component; flagged as a future improvement in the report.
 * ============================================================================
 */

import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { trips as tripsTable } from '@/db/schema';
import { useColors } from '@/hooks/useColors';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from './_layout';

export default function AddTrip() {
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

  if (!context) return null;
  const { setTrips } = context;

  /**
   * Silently returns if any required field is missing. A toast or Alert could be added here, but most users spot the missing field visually
   * before tapping save.
   *
   * Number(...) || fallback handles both empty strings and invalid input:
   * Number('') is 0 (falsy -fallback); Number('abc') is NaN (falsy - fallback).
   */
  const save = async () => {
    if (!name || !destination || !startDate || !endDate) return;
    await db.insert(tripsTable).values({
      userId: 1,
      name, destination, startDate, endDate,
      guestCount: Number(guestCount) || 1,
      budget: Number(budget) || 0,
      notes: notes || null,
    });
    // Refresh from DB so the new auto-generated id flows into shared state
    setTrips(await db.select().from(tripsTable));
    router.back();
  };

  return (
    <SafeAreaView style={{ backgroundColor: c.bg, flex: 1, padding: 20 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Plan a Hen" subtitle="Let's get this party started." />
        <FormField label="Hen Name" value={name} onChangeText={setName} placeholder="e.g. Sarah's Hen - Galway" />
        <FormField label="Destination" value={destination} onChangeText={setDestination} placeholder="e.g. Galway, Ireland" />
        <FormField label="Start Date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
        <FormField label="End Date" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
        <FormField label="Number of Guests" value={guestCount} onChangeText={setGuestCount} placeholder="e.g. 12" keyboardType="numeric" />
        <FormField label="Total Budget (€)" value={budget} onChangeText={setBudget} placeholder="e.g. 3500" keyboardType="numeric" />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Bride's name, theme, surprises..." />
        <View style={{ marginTop: 6 }}>
          <PrimaryButton label="Create Hen" onPress={save} />
          <View style={{ marginTop: 10 }}><PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} /></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}