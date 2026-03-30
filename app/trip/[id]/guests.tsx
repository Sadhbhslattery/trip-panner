import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useColors } from '@/hooks/useColors';
import { db } from '@/db/client';
import { guests as guestsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../../_layout';

const OPTS = ['full', 'partial', 'unsure', 'no'];
const lbl = (s: string) => s === 'full' ? 'Full trip' : s === 'partial' ? 'Part of trip' : s === 'unsure' ? 'Unsure' : "Can't make it";
const clr = (s: string) => s === 'full' ? ['#DCFCE7', '#166534'] : s === 'partial' ? ['#FEF3C7', '#92400E'] : s === 'no' ? ['#FEE2E2', '#991B1B'] : ['#F3F4F6', '#6B7280'];

export default function GuestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);
  const c = useColors();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dietary, setDietary] = useState('');
  const [attending, setAttending] = useState('full');
  const [notes, setNotes] = useState('');

  if (!context) return null;
  const { trips, guests, setGuests } = context;
  const trip = trips.find((t) => t.id === Number(id));
  if (!trip) return null;
  const tg = guests.filter((g) => g.tripId === Number(id));

  const reset = () => { setName(''); setPhone(''); setDietary(''); setAttending('full'); setNotes(''); setEditId(null); setShowForm(false); };

  const startEdit = (gid: number) => {
    const g = tg.find((x) => x.id === gid);
    if (!g) return;
    setName(g.name); setPhone(g.phone || ''); setDietary(g.dietary || ''); setAttending(g.attending); setNotes(g.notes || ''); setEditId(gid); setShowForm(true);
  };

  const save = async () => {
    if (!name) return;
    if (editId) { await db.update(guestsTable).set({ name, phone: phone || null, dietary: dietary || null, attending, notes: notes || null }).where(eq(guestsTable.id, editId)); }
    else { await db.insert(guestsTable).values({ tripId: Number(id), name, phone: phone || null, dietary: dietary || null, attending, notes: notes || null }); }
    setGuests(await db.select().from(guestsTable)); reset();
  };

  const del = async (gid: number) => { await db.delete(guestsTable).where(eq(guestsTable.id, gid)); setGuests(await db.select().from(guestsTable)); };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Guest List" subtitle={trip.name} />
        <View style={styles.chips}>
          {[{ n: tg.filter((g) => g.attending === 'full').length, l: 'Full' }, { n: tg.filter((g) => g.attending === 'partial').length, l: 'Partial' }, { n: tg.filter((g) => g.attending === 'unsure').length, l: 'Unsure' }, { n: tg.length, l: 'Total' }].map((s) => (
            <View key={s.l} style={[styles.chip, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>{s.n}</Text>
              <Text style={{ color: c.textFaint, fontSize: 11, marginTop: 2 }}>{s.l}</Text>
            </View>
          ))}
        </View>

        {!showForm ? <PrimaryButton label="+ Add Guest" onPress={() => setShowForm(true)} /> : null}

        {showForm ? (
          <View style={[styles.form, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={{ color: c.text, fontSize: 17, fontWeight: '700', marginBottom: 10 }}>{editId ? 'Edit Guest' : 'Add Guest'}</Text>
            <FormField label="Name" value={name} onChangeText={setName} placeholder="e.g. Amy" />
            <FormField label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="e.g. 087 123 4567" />
            <FormField label="Dietary (optional)" value={dietary} onChangeText={setDietary} placeholder="e.g. Vegetarian" />
            <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="e.g. Arriving late" />
            <Text style={{ color: c.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Attending</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {OPTS.map((o) => {
                const [bg, txt] = clr(o);
                return (
                  <Pressable key={o} style={[styles.attChip, { borderColor: txt }, attending === o && { backgroundColor: bg }]} onPress={() => setAttending(o)}>
                    <Text style={{ color: txt, fontSize: 13, fontWeight: '600' }}>{lbl(o)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <PrimaryButton label={editId ? 'Save Changes' : 'Add Guest'} onPress={save} />
            <View style={{ marginTop: 10 }}><PrimaryButton label="Cancel" variant="secondary" onPress={reset} /></View>
          </View>
        ) : null}

        {tg.map((g) => {
          const [bg, txt] = clr(g.attending);
          return (
            <View key={g.id} style={[styles.gCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{g.name}</Text>
                <View style={{ backgroundColor: bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: txt, fontSize: 11, fontWeight: '700' }}>{lbl(g.attending)}</Text>
                </View>
              </View>
              {g.phone ? <Text style={{ color: c.textSoft, fontSize: 13, marginTop: 6 }}>📱 {g.phone}</Text> : null}
              {g.dietary ? <Text style={{ color: '#D97706', fontSize: 13, fontWeight: '600', marginTop: 4 }}>⚠️ {g.dietary}</Text> : null}
              {g.notes ? <Text style={{ color: c.textFaint, fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>{g.notes}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                <Pressable onPress={() => startEdit(g.id)}><Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>Edit</Text></Pressable>
                <Pressable onPress={() => del(g.id)}><Text style={{ color: c.danger, fontSize: 13, fontWeight: '600' }}>Remove</Text></Pressable>
              </View>
            </View>
          );
        })}

        <View style={{ marginTop: 20, paddingBottom: 30 }}><PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} /></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: 20 },
  chips: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  chip: { alignItems: 'center', borderRadius: 10, borderWidth: 1, flex: 1, paddingVertical: 10 },
  form: { borderRadius: 14, borderWidth: 1, marginTop: 12, marginBottom: 16, padding: 14 },
  attChip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 7 },
  gCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, padding: 14 },
});
