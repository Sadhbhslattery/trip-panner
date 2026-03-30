import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useColors } from '@/hooks/useColors';
import { db } from '@/db/client';
import { trips as tripsTable } from '@/db/schema';
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

  const save = async () => {
    if (!name || !destination || !startDate || !endDate) return;
    await db.insert(tripsTable).values({ userId: 1, name, destination, startDate, endDate, guestCount: Number(guestCount) || 1, budget: Number(budget) || 0, notes: notes || null });
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
        <FormField label="Number of Guests" value={guestCount} onChangeText={setGuestCount} placeholder="e.g. 12" />
        <FormField label="Total Budget (€)" value={budget} onChangeText={setBudget} placeholder="e.g. 3500" />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Bride's name, theme, surprises..." />
        <View style={{ marginTop: 6 }}>
          <PrimaryButton label="Create Hen" onPress={save} />
          <View style={{ marginTop: 10 }}><PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} /></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
