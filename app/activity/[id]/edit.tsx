/**
 * Edit Activity Screen — Update an Existing Activity
 * 
 * Mirror of the Add Activity form, pre-populated with the activity's current values via useEffect. Same chip-based category picker, same required
 * fields (name, date, category), same optional fields (duration, cost, notes).
 *
 * Note on routing: this screen is reached from the trip detail screen by  tapping "Edit" on any activity card. The activity id is passed through
 * the URL params (expo-router dynamic segment) — the tripId is then read from the activity itself rather than from the URL, since an activity
 * always knows which trip it belongs to.
 */

import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { activities as activitiesTable } from '@/db/schema';
import { useColors } from '@/hooks/useColors';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../../_layout';

export default function EditActivity() {
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

  const activity = context?.activities.find((a) => a.id === Number(id));

  /**
   * Hydrate form state from the existing activity. Numeric fields convert to
   * strings because TextInput only accepts strings — they parse back to numbers at save time.
   */
  useEffect(() => {
    if (!activity) return;
    setName(activity.name);
    setDate(activity.date);
    setDuration(activity.duration > 0 ? activity.duration.toString() : '');
    setCost(activity.cost > 0 ? activity.cost.toString() : '');
    setNotes(activity.notes || '');
    setCatId(activity.categoryId);
  }, [activity]);

  if (!context || !activity) return null;
  const { categories, setActivities } = context;

  /**
   * Save handler — validates required fields, runs UPDATE, refreshes state.
   * Silently returns if validation fails; the form fields and category hint visually show what's missing.
   */
  const save = async () => {
    if (!name || !date || !catId) return;
    await db.update(activitiesTable).set({
      categoryId: catId,
      name, date,
      duration: Number(duration) || 0,
      cost: Number(cost) || 0,
      notes: notes || null,
    }).where(eq(activitiesTable.id, Number(id)));
    setActivities(await db.select().from(activitiesTable));
    router.back();
  };

  return (
    <SafeAreaView style={{ backgroundColor: c.bg, flex: 1, padding: 20 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Edit Activity" subtitle={`Update ${activity.name}`} />
        <FormField label="Activity Name" value={name} onChangeText={setName} />
        <FormField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <FormField label="Duration (minutes)" value={duration} onChangeText={setDuration} placeholder="e.g. 90 (optional)" keyboardType="numeric" />
        <FormField label="Cost (€)" value={cost} onChangeText={setCost} placeholder="e.g. 360 (total for group)" keyboardType="numeric" />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Booking ref, who's organising..." />

        <Text style={{ color: c.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Category</Text>
        {/* Same chip pattern as Add Activity — selected chip fills with colour */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {categories.map((cat) => (
            <Pressable key={cat.id}
              style={[{ borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 7, borderColor: cat.colour }, catId === cat.id && { backgroundColor: cat.colour }]}
              onPress={() => setCatId(cat.id)}
              accessibilityRole="button"
              accessibilityLabel={`${cat.name} category`}
              accessibilityState={{ selected: catId === cat.id }}>
              <Text style={[{ fontSize: 13, fontWeight: '600', color: cat.colour }, catId === cat.id && { color: '#FFF' }]}>{cat.icon} {cat.name}</Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton label="Save Changes" onPress={save} />
        <View style={{ marginTop: 10, paddingBottom: 30 }}><PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} /></View>
      </ScrollView>
    </SafeAreaView>
  );
}