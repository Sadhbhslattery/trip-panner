import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../_layout';

export default function IndexScreen() {
  const router = useRouter();
  const context = useContext(TripContext);
  const [searchText, setSearchText] = useState('');

  if (!context) return null;

  const { trips, activities } = context;

  const filteredTrips = trips.filter((trip) => {
    const query = searchText.toLowerCase();
    return (
      trip.name.toLowerCase().includes(query) ||
      trip.destination.toLowerCase().includes(query)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Hen Planner"
        subtitle={`${trips.length} hens in the works`}
      />

      <PrimaryButton
        label="+ Plan a Hen"
        onPress={() => router.push('/add-trip')}
      />

      <TextInput
        style={styles.searchBar}
        placeholder="Search by name or destination..."
        placeholderTextColor="#9CA3AF"
        value={searchText}
        onChangeText={setSearchText}
      />

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTrips.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchText ? 'No hens match your search.' : 'No hens planned yet. Time to get organising!'}
          </Text>
        ) : null}

        {filteredTrips.map((trip) => {
          const tripActivities = activities.filter((a) => a.tripId === trip.id);
          const totalCost = tripActivities.reduce((sum, a) => sum + a.cost, 0);
          const perPerson = trip.guestCount > 0 ? Math.round(totalCost / trip.guestCount) : 0;
          const budgetLeft = trip.budget - totalCost;

          return (
            <Pressable
              key={trip.id}
              style={styles.card}
              onPress={() =>
                router.push({ pathname: '/trip/[id]', params: { id: trip.id.toString() } })
              }
            >
              <Text style={styles.tripName}>{trip.name}</Text>
              <Text style={styles.destination}>{trip.destination}</Text>

              <View style={styles.tags}>
                <InfoTag label="From" value={trip.startDate} />
                <InfoTag label="To" value={trip.endDate} />
                <InfoTag label="Guests" value={trip.guestCount.toString()} />
              </View>

              <View style={styles.costRow}>
                <Text style={styles.costText}>
                  Total: €{totalCost} · €{perPerson}/person
                </Text>
                {trip.budget > 0 ? (
                  <Text style={[styles.budgetText, budgetLeft < 0 && styles.overBudget]}>
                    {budgetLeft >= 0 ? `€${budgetLeft} left` : `€${Math.abs(budgetLeft)} over!`}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.activityCount}>
                {tripActivities.length}{' '}
                {tripActivities.length === 1 ? 'activity' : 'activities'} planned
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFF8FA',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F0C6D4',
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F0C6D4',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  tripName: {
    color: '#1F1126',
    fontSize: 18,
    fontWeight: '700',
  },
  destination: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  costText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  budgetText: {
    color: '#2E9E6B',
    fontSize: 13,
    fontWeight: '700',
  },
  overBudget: {
    color: '#DC2626',
  },
  activityCount: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 6,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
    marginTop: 30,
    textAlign: 'center',
  },
});
