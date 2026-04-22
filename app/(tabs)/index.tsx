import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useColors } from '@/hooks/useColors';
import { useRouter } from 'expo-router';
import { useContext, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../_layout';

export default function IndexScreen() {
  const router = useRouter();
  const context = useContext(TripContext);
  const c = useColors();
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  if (!context) return null;
  const { trips, activities, categories } = context;

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase();
    return trips.filter((t) => {
      // Text filter
      const textMatch = !q || t.name.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q);
      if (!textMatch) return false;

      // Date range filter (trip overlaps the range at all)
      if (dateFrom && t.endDate < dateFrom) return false;
      if (dateTo && t.startDate > dateTo) return false;

      // Category filter (trip has at least one activity in this category)
      if (categoryId !== null) {
        const hasCategory = activities.some((a) => a.tripId === t.id && a.categoryId === categoryId);
        if (!hasCategory) return false;
      }

      return true;
    });
  }, [trips, activities, searchText, dateFrom, dateTo, categoryId]);

  const activeFilterCount = (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (categoryId !== null ? 1 : 0);

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setCategoryId(null);
  };

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
        accessibilityLabel="Search hens by name or destination"
      />

      <Pressable
        style={[styles.filterToggle, { backgroundColor: c.card, borderColor: c.border }]}
        onPress={() => setShowFilters((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={showFilters ? 'Hide filters' : 'Show filters'}
        accessibilityState={{ expanded: showFilters }}
      >
        <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>
          {showFilters ? '▾ Filters' : '▸ Filters'}
          {activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}
        </Text>
        {activeFilterCount > 0 ? (
          <Pressable onPress={clearFilters} accessibilityRole="button" accessibilityLabel="Clear all filters">
            <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>Clear</Text>
          </Pressable>
        ) : null}
      </Pressable>

      {showFilters ? (
        <View style={[styles.filterPanel, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={{ color: c.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Date range</Text>
          <View style={styles.dateRow}>
            <TextInput
              style={[styles.dateInput, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.text }]}
              placeholder="From (YYYY-MM-DD)"
              placeholderTextColor={c.textFaint}
              value={dateFrom}
              onChangeText={setDateFrom}
              accessibilityLabel="Filter from date"
            />
            <TextInput
              style={[styles.dateInput, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.text }]}
              placeholder="To (YYYY-MM-DD)"
              placeholderTextColor={c.textFaint}
              value={dateTo}
              onChangeText={setDateTo}
              accessibilityLabel="Filter to date"
            />
          </View>

          <Text style={{ color: c.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10 }}>Category</Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, { backgroundColor: c.bg, borderColor: c.border }, categoryId === null && { backgroundColor: c.accent, borderColor: c.accent }]}
              onPress={() => setCategoryId(null)}
              accessibilityRole="button"
              accessibilityLabel="All categories"
              accessibilityState={{ selected: categoryId === null }}
            >
              <Text style={[{ color: c.text, fontSize: 12, fontWeight: '600' }, categoryId === null && { color: '#FFF' }]}>All</Text>
            </Pressable>
            {categories.map((cat) => {
              const selected = categoryId === cat.id;
              return (
                <Pressable key={cat.id}
                  style={[styles.chip, { backgroundColor: c.bg, borderColor: c.border }, selected && { backgroundColor: cat.colour, borderColor: cat.colour }]}
                  onPress={() => setCategoryId(cat.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${cat.name} category filter`}
                  accessibilityState={{ selected }}
                >
                  <Text style={[{ color: c.text, fontSize: 12, fontWeight: '600' }, selected && { color: '#FFF' }]}>{cat.icon} {cat.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={[styles.empty, { color: c.textFaint }]}>
            {searchText || activeFilterCount > 0
              ? 'No hens match your filters.'
              : 'No hens planned yet!'}
          </Text>
        ) : null}
        {filtered.map((trip) => {
          const acts = activities.filter((a) => a.tripId === trip.id);
          const total = acts.reduce((s, a) => s + a.cost, 0);
          const pp = trip.guestCount > 0 ? Math.round(total / trip.guestCount) : 0;
          const left = trip.budget - total;
          return (
            <Pressable key={trip.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id.toString() } })}
              accessibilityRole="button"
              accessibilityLabel={`Open ${trip.name} in ${trip.destination}`}>
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
  filterToggle: { alignItems: 'center', borderRadius: 10, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 12, paddingVertical: 10 },
  filterPanel: { borderRadius: 10, borderWidth: 1, marginTop: 8, padding: 12 },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateInput: { borderRadius: 10, borderWidth: 1, flex: 1, fontSize: 14, paddingHorizontal: 10, paddingVertical: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  list: { paddingBottom: 24, paddingTop: 14 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 12, padding: 14 },
  name: { fontSize: 18, fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  empty: { fontSize: 15, marginTop: 30, textAlign: 'center' },
});