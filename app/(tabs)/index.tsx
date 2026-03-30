import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useColors } from '@/hooks/useColors';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../_layout';

export default function IndexScreen() {
  const router = useRouter();
  const context = useContext(TripContext);
  const c = useColors();
  const [searchText, setSearchText] = useState('');

  if (!context) return null;
  const { trips, activities } = context;

  const filtered = trips.filter((t) => {
    const q = searchText.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Hen Planner" subtitle={`${trips.length} hens in the works`} />
      <PrimaryButton label="+ Plan a Hen" onPress={() => router.push('/add-trip')} />
      <TextInput
        style={[styles.search, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.text }]}
        placeholder="Search by name or destination..."
        placeholderTextColor={c.textFaint}
        value={searchText}
        onChangeText={setSearchText}
      />
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={[styles.empty, { color: c.textFaint }]}>
            {searchText ? 'No hens match your search.' : 'No hens planned yet!'}
          </Text>
        ) : null}
        {filtered.map((trip) => {
          const acts = activities.filter((a) => a.tripId === trip.id);
          const total = acts.reduce((s, a) => s + a.cost, 0);
          const pp = trip.guestCount > 0 ? Math.round(total / trip.guestCount) : 0;
          const left = trip.budget - total;
          return (
            <Pressable key={trip.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id.toString() } })}>
              <Text style={[styles.name, { color: c.text }]}>{trip.name}</Text>
              <Text style={{ color: c.textSoft, fontSize: 14, marginTop: 2 }}>{trip.destination}</Text>
              <View style={styles.tags}>
                <InfoTag label="From" value={trip.startDate} />
                <InfoTag label="To" value={trip.endDate} />
                <InfoTag label="Guests" value={trip.guestCount.toString()} />
              </View>
              <View style={styles.costRow}>
                <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>€{total} · €{pp}/pp</Text>
                {trip.budget > 0 ? (
                  <Text style={{ color: left >= 0 ? c.success : c.danger, fontSize: 13, fontWeight: '700' }}>
                    {left >= 0 ? `€${left} left` : `€${Math.abs(left)} over!`}
                  </Text>
                ) : null}
              </View>
              <Text style={{ color: c.textFaint, fontSize: 13, marginTop: 6 }}>
                {acts.length} {acts.length === 1 ? 'activity' : 'activities'} planned
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  search: { borderRadius: 10, borderWidth: 1, fontSize: 15, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10 },
  list: { paddingBottom: 24, paddingTop: 14 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 12, padding: 14 },
  name: { fontSize: 18, fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  empty: { fontSize: 15, marginTop: 30, textAlign: 'center' },
});
