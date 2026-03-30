import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { activities as activitiesTable } from '@/db/schema';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../../_layout';

export default function AddActivity() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  if (!context) return null;
  const { categories, setActivities } = context;

  const saveActivity = async () => {
    if (!name || !date || !selectedCategory) return;

    await db.insert(activitiesTable).values({
      tripId: Number(id),
      categoryId: selectedCategory,
      name,
      date,
      duration: Number(duration) || 0,
      cost: Number(cost) || 0,
      notes: notes || null,
    });

    const rows = await db.select().from(activitiesTable);
    setActivities(rows);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Add Activity" subtitle="What's the plan?" />

        <View style={styles.form}>
          <FormField label="Activity Name" value={name} onChangeText={setName} placeholder="e.g. Cocktail making class" />
          <FormField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <FormField label="Duration (minutes)" value={duration} onChangeText={setDuration} placeholder="e.g. 90 (optional)" />
          <FormField label="Cost (€)" value={cost} onChangeText={setCost} placeholder="e.g. 360 (total for the group)" />
          <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Booking ref, who's organising..." />
        </View>

        <Text style={styles.categoryLabel}>Category</Text>
        <View style={styles.categoryList}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryChip,
                { borderColor: cat.colour },
                selectedCategory === cat.id && { backgroundColor: cat.colour },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: cat.colour },
                  selectedCategory === cat.id && { color: '#FFFFFF' },
                ]}
              >
                {cat.icon} {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedCategory === null ? (
          <Text style={styles.hint}>Pick a category above</Text>
        ) : null}

        <View style={styles.buttons}>
          <PrimaryButton label="Save Activity" onPress={saveActivity} />
          <View style={styles.spacer}>
            <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
          </View>
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
  categoryLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 12,
  },
  buttons: {
    marginTop: 8,
    paddingBottom: 30,
  },
  spacer: {
    marginTop: 10,
  },
});
