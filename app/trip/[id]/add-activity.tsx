import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useColors } from '@/hooks/useColors';
import { db } from '@/db/client';
import { activities as activitiesTable } from '@/db/schema';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../../_layout';

export default function AddActivity() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);
  const c = useColors();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [catId, setCatId] = useState<number | null>(null);

  if (!context) return null;
  const { categories, setActivities } = context;

  const save = async () => {
    if (!name || !date || !catId) return;
    await db.insert(activitiesTable).values({ tripId: Number(id), categoryId: catId, name, date, duration: Number(duration) || 0, cost: Number(cost) || 0, notes: notes || null });
    setActivities(await db.select().from(activitiesTable));
    router.back();
  };

  return (
    <SafeAreaView style={{ backgroundColor: c.bg, flex: 1, padding: 20 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Add Activity" subtitle="What's the plan?" />
        <FormField label="Activity Name" value={name} onChangeText={setName} placeholder="e.g. Cocktail making class" />
        <FormField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <FormField label="Duration (minutes)" value={duration} onChangeText={setDuration} placeholder="e.g. 90 (optional)" />
        <FormField label="Cost (€)" value={cost} onChangeText={setCost} placeholder="e.g. 360 (total for group)" />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Booking ref, who's organising..." />
        <Text style={{ color: c.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {categories.map((cat) => (
            <Pressable key={cat.id} style={[{ borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 7, borderColor: cat.colour }, catId === cat.id && { backgroundColor: cat.colour }]} onPress={() => setCatId(cat.id)}>
              <Text style={[{ fontSize: 13, fontWeight: '600', color: cat.colour }, catId === cat.id && { color: '#FFF' }]}>{cat.icon} {cat.name}</Text>
            </Pressable>
          ))}
        </View>
        {catId === null ? <Text style={{ color: c.textFaint, fontSize: 13, marginBottom: 12 }}>Pick a category above</Text> : null}
        <PrimaryButton label="Save Activity" onPress={save} />
        <View style={{ marginTop: 10, paddingBottom: 30 }}><PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} /></View>
      </ScrollView>
    </SafeAreaView>
  );
}
