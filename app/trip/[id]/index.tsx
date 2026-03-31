import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import WeatherCard from '@/components/WeatherCard';
import { useColors } from '@/hooks/useColors';
import { db } from '@/db/client';
import { activities as activitiesTable, trips as tripsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../../_layout';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);
  const c = useColors();
  if (!context) return null;

  const { trips, setTrips, activities, setActivities, categories, guests } = context;
  const trip = trips.find((t) => t.id === Number(id));
  if (!trip) return null;

  const acts = activities.filter((a) => a.tripId === trip.id);
  const tGuests = guests.filter((g) => g.tripId === trip.id);
  const confirmed = tGuests.filter((g) => g.attending === 'full' || g.attending === 'partial').length;
  const unsure = tGuests.filter((g) => g.attending === 'unsure').length;
  const dietary = tGuests.filter((g) => g.dietary).length;
  const total = acts.reduce((s, a) => s + a.cost, 0);
  const pp = trip.guestCount > 0 ? Math.round(total / trip.guestCount) : 0;
  const left = trip.budget - total;
  const pct = trip.budget > 0 ? Math.min((total / trip.budget) * 100, 100) : 0;

  const getCat = (cid: number) => categories.find((x) => x.id === cid);

  const delTrip = async () => {
    await db.delete(activitiesTable).where(eq(activitiesTable.tripId, Number(id)));
    await db.delete(tripsTable).where(eq(tripsTable.id, Number(id)));
    setTrips(await db.select().from(tripsTable));
    setActivities(await db.select().from(activitiesTable));
    router.back();
  };

  const delAct = async (aid: number) => {
    await db.delete(activitiesTable).where(eq(activitiesTable.id, aid));
    setActivities(await db.select().from(activitiesTable));
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title={trip.name} subtitle={trip.destination} />
        <View style={styles.tags}>
          <InfoTag label="From" value={trip.startDate} />
          <InfoTag label="To" value={trip.endDate} />
          <InfoTag label="Guests" value={trip.guestCount.toString()} />
        </View>
        {trip.notes ? <Text style={{ color: c.textSoft, fontSize: 14, fontStyle: 'italic', marginBottom: 12 }}>{trip.notes}</Text> : null}

        {/* Weather forecast for the destination */}
        <WeatherCard destination={trip.destination} />

        {/* Budget card */}
        <View style={[styles.budgetCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Budget</Text>
          <View style={styles.bRow}><Text style={{ color: c.textSoft }}>Total spent</Text><Text style={{ color: c.text, fontWeight: '600' }}>€{total}</Text></View>
          <View style={styles.bRow}><Text style={{ color: c.textSoft }}>Per person ({trip.guestCount})</Text><Text style={{ color: c.text, fontWeight: '600' }}>€{pp}</Text></View>
          {trip.budget > 0 ? (
            <>
              <View style={styles.bRow}><Text style={{ color: c.textSoft }}>Budget</Text><Text style={{ color: c.text, fontWeight: '600' }}>€{trip.budget}</Text></View>
              <View style={[styles.progTrack, { backgroundColor: c.trackBg }]}>
                <View style={[styles.progFill, { width: `${pct}%`, backgroundColor: left >= 0 ? c.success : c.danger }]} />
              </View>
              <Text style={{ color: left >= 0 ? c.success : c.danger, fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                {left >= 0 ? `€${left} remaining` : `€${Math.abs(left)} over budget!`}
              </Text>
            </>
          ) : null}
        </View>

        {/* Guest list summary */}
        <Pressable style={[styles.guestCard, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => router.push({ pathname: '/trip/[id]/guests', params: { id } })}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Guest List</Text>
          <Text style={{ color: c.textSoft, fontSize: 14 }}>
            {confirmed} confirmed{unsure > 0 ? ` · ${unsure} unsure` : ''}{dietary > 0 ? ` · ${dietary} dietary` : ''}
          </Text>
          <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600', marginTop: 8 }}>View full guest list →</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <PrimaryButton compact label="Edit Hen" onPress={() => router.push({ pathname: '/trip/[id]/edit', params: { id } })} />
        </View>

        {/* Activities */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Activities ({acts.length})</Text>
          <PrimaryButton compact label="+ Add" onPress={() => router.push({ pathname: '/trip/[id]/add-activity', params: { id } })} />
        </View>

        {acts.length === 0 ? <Text style={{ color: c.textFaint, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>No activities yet!</Text> : null}

        {acts.map((a) => {
          const cat = getCat(a.categoryId);
          return (
            <View key={a.id} style={[styles.actCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cat?.colour || '#9CA3AF', marginRight: 8 }} />
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '600', flex: 1 }}>{cat?.icon || '📌'} {a.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                <Text style={{ color: c.textSoft, fontSize: 13 }}>{a.date}</Text>
                {a.duration > 0 ? <Text style={{ color: c.textSoft, fontSize: 13 }}>{a.duration} min</Text> : null}
                <Text style={{ color: cat?.colour || c.textSoft, fontSize: 13 }}>{cat?.name || '?'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>€{a.cost}</Text>
                {trip.guestCount > 0 ? <Text style={{ color: c.textFaint, fontSize: 12 }}>(€{Math.round(a.cost / trip.guestCount)}/pp)</Text> : null}
              </View>
              {a.notes ? <Text style={{ color: c.textFaint, fontSize: 13, fontStyle: 'italic', marginTop: 6 }}>{a.notes}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                <Pressable onPress={() => router.push({ pathname: '/activity/[id]/edit', params: { id: a.id.toString() } })}><Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>Edit</Text></Pressable>
                <Pressable onPress={() => delAct(a.id)}><Text style={{ color: c.danger, fontSize: 13, fontWeight: '600' }}>Delete</Text></Pressable>
              </View>
            </View>
          );
        })}

        <View style={{ marginTop: 24, paddingBottom: 30 }}>
          <PrimaryButton label="Delete Hen" variant="danger" onPress={delTrip} />
          <View style={{ height: 10 }} />
          <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  budgetCard: { borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 14 },
  bRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progTrack: { borderRadius: 6, height: 10, marginTop: 8, overflow: 'hidden' },
  progFill: { borderRadius: 6, height: 10 },
  guestCard: { borderRadius: 12, borderWidth: 1, marginBottom: 16, padding: 14 },
  actCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, padding: 12 },
});
