import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { guests as guestsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../../_layout';

const ATTENDING_OPTIONS = ['full', 'partial', 'unsure', 'no'];

export default function GuestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dietary, setDietary] = useState('');
  const [attending, setAttending] = useState('full');
  const [notes, setNotes] = useState('');

  if (!context) return null;
  const { trips, guests, setGuests } = context;

  const trip = trips.find((t) => t.id === Number(id));
  if (!trip) return null;

  const tripGuests = guests.filter((g) => g.tripId === Number(id));
  const confirmedCount = tripGuests.filter((g) => g.attending === 'full').length;
  const partialCount = tripGuests.filter((g) => g.attending === 'partial').length;
  const unsureCount = tripGuests.filter((g) => g.attending === 'unsure').length;

  const resetForm = () => {
    setName('');
    setPhone('');
    setDietary('');
    setAttending('full');
    setNotes('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEditing = (guestId: number) => {
    const guest = tripGuests.find((g) => g.id === guestId);
    if (!guest) return;
    setName(guest.name);
    setPhone(guest.phone || '');
    setDietary(guest.dietary || '');
    setAttending(guest.attending);
    setNotes(guest.notes || '');
    setEditingId(guestId);
    setShowForm(true);
  };

  const saveGuest = async () => {
    if (!name) return;

    if (editingId) {
      await db.update(guestsTable).set({
        name, phone: phone || null, dietary: dietary || null, attending, notes: notes || null,
      }).where(eq(guestsTable.id, editingId));
    } else {
      await db.insert(guestsTable).values({
        tripId: Number(id), name, phone: phone || null, dietary: dietary || null, attending, notes: notes || null,
      });
    }

    const rows = await db.select().from(guestsTable);
    setGuests(rows);
    resetForm();
  };

  const deleteGuest = async (guestId: number) => {
    await db.delete(guestsTable).where(eq(guestsTable.id, guestId));
    const rows = await db.select().from(guestsTable);
    setGuests(rows);
  };

  const getAttendingStyle = (status: string) => {
    switch (status) {
      case 'full': return { bg: '#DCFCE7', text: '#166534', label: 'Full trip' };
      case 'partial': return { bg: '#FEF3C7', text: '#92400E', label: 'Part of trip' };
      case 'unsure': return { bg: '#F3F4F6', text: '#6B7280', label: 'Unsure' };
      case 'no': return { bg: '#FEE2E2', text: '#991B1B', label: 'Can\'t make it' };
      default: return { bg: '#F3F4F6', text: '#6B7280', label: status };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Guest List" subtitle={`${trip.name}`} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryNumber}>{confirmedCount}</Text>
            <Text style={styles.summaryLabel}>Full</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryNumber}>{partialCount}</Text>
            <Text style={styles.summaryLabel}>Partial</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryNumber}>{unsureCount}</Text>
            <Text style={styles.summaryLabel}>Unsure</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryNumber}>{tripGuests.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>

        {!showForm ? (
          <PrimaryButton label="+ Add Guest" onPress={() => setShowForm(true)} />
        ) : null}

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{editingId ? 'Edit Guest' : 'Add Guest'}</Text>
            <FormField label="Name" value={name} onChangeText={setName} placeholder="e.g. Amy" />
            <FormField label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="e.g. 087 123 4567" />
            <FormField label="Dietary requirements (optional)" value={dietary} onChangeText={setDietary} placeholder="e.g. Vegetarian, Coeliac" />
            <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="e.g. Sarah's sister, arriving late" />

            <Text style={styles.attendingLabel}>Attending</Text>
            <View style={styles.attendingRow}>
              {ATTENDING_OPTIONS.map((opt) => {
                const style = getAttendingStyle(opt);
                return (
                  <Pressable
                    key={opt}
                    style={[
                      styles.attendingChip,
                      { borderColor: style.text },
                      attending === opt && { backgroundColor: style.bg },
                    ]}
                    onPress={() => setAttending(opt)}
                  >
                    <Text style={[styles.attendingChipText, { color: style.text }]}>
                      {style.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.formButtons}>
              <PrimaryButton label={editingId ? 'Save Changes' : 'Add Guest'} onPress={saveGuest} />
              <View style={styles.spacer}>
                <PrimaryButton label="Cancel" variant="secondary" onPress={resetForm} />
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.listSection}>
          {tripGuests.length === 0 ? (
            <Text style={styles.emptyText}>No guests added yet.</Text>
          ) : null}

          {tripGuests.map((guest) => {
            const style = getAttendingStyle(guest.attending);
            return (
              <View key={guest.id} style={styles.guestCard}>
                <View style={styles.guestTop}>
                  <Text style={styles.guestName}>{guest.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
                    <Text style={[styles.statusText, { color: style.text }]}>{style.label}</Text>
                  </View>
                </View>

                {guest.phone ? <Text style={styles.guestDetail}>📱 {guest.phone}</Text> : null}
                {guest.dietary ? <Text style={styles.guestDietary}>⚠️ {guest.dietary}</Text> : null}
                {guest.notes ? <Text style={styles.guestNotes}>{guest.notes}</Text> : null}

                <View style={styles.guestActions}>
                  <Pressable onPress={() => startEditing(guest.id)}>
                    <Text style={styles.editLink}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteGuest(guest.id)}>
                    <Text style={styles.deleteLink}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.bottomButton}>
          <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FFF8FA', flex: 1, padding: 20 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryChip: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#F0C6D4', borderRadius: 10, borderWidth: 1, flex: 1, paddingVertical: 10 },
  summaryNumber: { color: '#1F1126', fontSize: 20, fontWeight: '700' },
  summaryLabel: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },
  formCard: { backgroundColor: '#FFFFFF', borderColor: '#F0C6D4', borderRadius: 14, borderWidth: 1, marginTop: 12, marginBottom: 16, padding: 14 },
  formTitle: { color: '#1F1126', fontSize: 17, fontWeight: '700', marginBottom: 10 },
  attendingLabel: { color: '#334155', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  attendingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  attendingChip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 7 },
  attendingChipText: { fontSize: 13, fontWeight: '600' },
  formButtons: { marginTop: 8 },
  spacer: { marginTop: 10 },
  listSection: { marginTop: 8 },
  guestCard: { backgroundColor: '#FFFFFF', borderColor: '#F0C6D4', borderRadius: 12, borderWidth: 1, marginBottom: 10, padding: 14 },
  guestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  guestName: { color: '#1F1126', fontSize: 16, fontWeight: '600' },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  guestDetail: { color: '#6B7280', fontSize: 13, marginTop: 6 },
  guestDietary: { color: '#D97706', fontSize: 13, fontWeight: '600', marginTop: 4 },
  guestNotes: { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic', marginTop: 4 },
  guestActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  editLink: { color: '#D4537E', fontSize: 13, fontWeight: '600' },
  deleteLink: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 20 },
  bottomButton: { marginTop: 20, paddingBottom: 30 },
});
